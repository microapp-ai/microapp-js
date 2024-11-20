@echo off

set args=%*

if "%args%"=="" (
  node "%~dp0\run" init
) else (
  node "%~dp0\run" %*
)