import os
import glob
from distutils.dir_util import copy_tree
import shutil

srcfiles = glob.glob('./src/cage/*.ts')
cmd = 'tsc --allowJs -m ES6 -t ES6 --outDir dist --sourceMap --alwaysStrict ' + " ".join(srcfiles)
print('Building TypeScript: ' + cmd)
os.system(cmd)
copy_tree('./src/cage/static', './dist')
