ARG DOTNET_VERSION=10.0
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION}-alpine AS build
WORKDIR /src
COPY DijitalAtolye.sln Directory.Build.props Directory.Packages.props NuGet.config global.json ./
COPY src/BuildingBlocks/ ./src/BuildingBlocks/
COPY src/Services/Content/ ./src/Services/Content/
RUN dotnet publish src/Services/Content/Content.API/Content.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION}-alpine AS runtime
RUN apk add --no-cache icu-libs tzdata curl
ENV ASPNETCORE_URLS=http://+:8080 TZ=Europe/Istanbul
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish/ ./
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:8080/health/live || exit 1
ENTRYPOINT ["dotnet", "DijitalAtolye.Content.API.dll"]
