# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "socket"
  spec.version       = "0.1.0"
  spec.authors       = ["codecap"]
  spec.email         = ["codecap@users.noreply.github.com"]

  spec.summary       = "Socket"
  spec.homepage      = "https://codecap.github.io/socket.de"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f| f.match(%r!^(assets|_layouts|_includes|_sass|LICENSE|README|_config\.yml)!i) }

  spec.add_runtime_dependency "jekyll", "~> 4.2"
  spec.add_runtime_dependency "bundler", "~> 2.2.6"
  spec.add_runtime_dependency "webrick"
  spec.add_runtime_dependency "jekyll-feed", "~> 0.12"
  spec.add_runtime_dependency "jekyll-seo-tag", "~> 2.6"
end
