{ pkgs ? import <nixpkgs> {} }:

let
  lib = import <nixpkgs/lib>;
  buildNodeJs = pkgs.callPackage <nixpkgs/pkgs/development/web/nodejs/nodejs.nix> {
    python = pkgs.python3;
  };

  nodejsVersion = lib.fileContents ~/.nvmrc;

  nodejs = buildNodeJs {
    enableNpm = true;
    version = nodejsVersion;
    sha256 = "g+AzgeJx8aVhkYjnrqnYXZt+EvW+KijOt41ySe0it/E=";
  };

in pkgs.mkShell {
  packages = with pkgs; [
    python3
    deno
    nodejs
    nodePackages.npm
    nodePackages.typescript
  ];
}
