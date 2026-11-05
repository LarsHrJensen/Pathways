using backend.Services;
using Npgsql;
using repositories.interfaces;
using repositories;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration
    .GetConnectionString("MusicBrainzDb")
    ?? throw new InvalidOperationException(
        "MusicBrainz connection is missing.");
    
builder.Services.AddSingleton(
    NpgsqlDataSource.Create(connectionString));

builder.Services.AddControllers();
builder.Services.AddScoped<
    IMusicBrainzRepository,
    MusicBrainzRepository>();
builder.Services.AddScoped<MusicBrainzService>();
builder.Services.AddScoped<WikidataService>();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:4200")
                .AllowAnyHeader()
                .AllowAnyMethod(); 
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
     app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngularDev");

app.UseHttpsRedirection();

app.MapControllers();

app.Run();