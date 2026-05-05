FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Downloader.WebApi/Downloader.WebApi.csproj", "Downloader.WebApi/"]
COPY ["Downloader.Data/Downloader.Data.csproj", "Downloader.Data/"]
COPY ["Downloader.DataApi/Downloader.DataApi.csproj", "Downloader.DataApi/"]
RUN dotnet restore "Downloader.WebApi/Downloader.WebApi.csproj"
COPY . .
WORKDIR "/src/Downloader.WebApi"
RUN dotnet build "./Downloader.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Downloader.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Downloader.WebApi.dll"]
