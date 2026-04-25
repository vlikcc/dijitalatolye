using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace DijitalAtolye.BuildingBlocks.WebHostExtensions.Validation;

public static class FluentValidationExtensions
{
    public static IServiceCollection AddFluentValidatorsFromAssembly(
        this IServiceCollection services,
        Assembly assembly)
    {
        services.AddValidatorsFromAssembly(assembly, ServiceLifetime.Scoped);
        return services;
    }
}
