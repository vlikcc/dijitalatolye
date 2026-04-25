using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DijitalAtolye.Notification.API.Realtime;

[Authorize]
public sealed class NotificationsHub : Hub
{
    public override Task OnConnectedAsync()
    {
        var sub = Context.User?.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(sub))
        {
            Groups.AddToGroupAsync(Context.ConnectionId, $"user-{sub}");
        }
        return base.OnConnectedAsync();
    }
}
