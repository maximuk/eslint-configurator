VERSION := patch

release:
	echo "Releasing version: $(VERSION)"
	git checkout master
	git pull origin master
	npm run lint
	npm test
	npm version $(VERSION)
	npm publish
	git push --no-verify --follow-tags
