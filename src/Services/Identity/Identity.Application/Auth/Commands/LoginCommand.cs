using DijitalAtolye.BuildingBlocks.Common.Errors;
using DijitalAtolye.BuildingBlocks.Common.Results;
using DijitalAtolye.Identity.Application.Auth.Tokens;
using DijitalAtolye.Identity.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace DijitalAtolye.Identity.Application.Auth.Commands;

public sealed record LoginCommand(string Email, string Password, string? IpAddress) : IRequest<Result<TokenPair>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler : IRequestHandler<LoginCommand, Result<TokenPair>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenIssuer _tokenIssuer;

    public LoginCommandHandler(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenIssuer tokenIssuer)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenIssuer = tokenIssuer;
    }

    public async Task<Result<TokenPair>> Handle(LoginCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(command.Email);
        if (user is null)
        {
            return CommonErrors.Unauthorized();
        }

        if (user.IsLocked || await _userManager.IsLockedOutAsync(user))
        {
            return Error.Forbidden("auth.locked", "Hesabınız kilitli. Daha sonra tekrar deneyin.");
        }

        var signIn = await _signInManager.CheckPasswordSignInAsync(user, command.Password, lockoutOnFailure: true);
        if (!signIn.Succeeded)
        {
            return CommonErrors.Unauthorized();
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var pair = await _tokenIssuer.IssueAsync(user, roles, command.IpAddress, ct);
        return pair;
    }
}
