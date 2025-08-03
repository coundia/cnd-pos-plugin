
npm login

npm publish --access public

git tag v1.0.1
git push origin main --tags
npm publish --access public


git rm -r --cached node_modules
git rm -r --cached dist