cd \repos\firefly-doc
git pull
cd \temp\site
git clean -f
git checkout .
git pull
buildsite\buildsite.exe c:\repos\firefly-doc c:\temp\site noserver
CommitChanges.bat