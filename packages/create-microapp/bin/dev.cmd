@echo off

set args=%*

if "%args%"=="" (
  node "%~dp0\dev" init
) else (
  node "%~dp0\dev" %*
)