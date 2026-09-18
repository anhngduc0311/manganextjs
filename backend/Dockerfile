# Stage 1: Build .NET Solution
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /source

# Copy solution and csproj files for layer caching
COPY TruyenKomi.slnx .
COPY src/TruyenKomi.Domain/TruyenKomi.Domain.csproj src/TruyenKomi.Domain/
COPY src/TruyenKomi.Application/TruyenKomi.Application.csproj src/TruyenKomi.Application/
COPY src/TruyenKomi.Infrastructure/TruyenKomi.Infrastructure.csproj src/TruyenKomi.Infrastructure/
COPY src/TruyenKomi.Api/TruyenKomi.Api.csproj src/TruyenKomi.Api/

# Restore dependencies
RUN dotnet restore src/TruyenKomi.Api/TruyenKomi.Api.csproj

# Copy all source files
COPY src/ src/

# Publish Release
WORKDIR /source/src/TruyenKomi.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build /app/publish .

EXPOSE 5000

ENTRYPOINT ["dotnet", "TruyenKomi.Api.dll"]
