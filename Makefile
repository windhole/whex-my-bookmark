.PHONY: chrome firefox safari test typecheck show-version version-patch version-minor version-major

chrome: node_modules
	npm test
	npm run build
	@$(MAKE) -s show-version

test: node_modules
	npm test

typecheck: node_modules
	npm run typecheck

show-version:
	@node scripts/show-version.mjs

version-patch: node_modules
	npm run version:patch
	@$(MAKE) -s show-version

version-minor: node_modules
	npm run version:minor
	@$(MAKE) -s show-version

version-major: node_modules
	npm run version:major
	@$(MAKE) -s show-version

node_modules: package.json
	npm install
	@touch node_modules

# Future: copy dist/chrome, add browser_specific_settings.gecko.id, adjust manifest as needed.
firefox:
	@echo "Not implemented yet (ADR-0001)."
	@echo "Planned: generate dist/firefox from shared src with gecko id in the manifest."
	@exit 1

# Future: xcrun safari-web-extension-converter dist/chrome --project-location dist/safari
safari:
	@echo "Not implemented yet (ADR-0001)."
	@echo "Planned: xcrun safari-web-extension-converter dist/chrome --project-location dist/safari"
	@exit 1
