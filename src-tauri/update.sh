#!/bin/bash

tauri_conf_path="./tauri.conf.json"

product_name=$(python -c "import json; print(json.load(open('$tauri_conf_path'))['productName'])")
version=$(python -c "import json; print(json.load(open('$tauri_conf_path'))['version'])")

sig_file_path="./target/release/bundle/nsis/${product_name}_${version}_x64-setup.exe.sig"
update_json_path="./target/release/bundle/nsis/update.json"

arch=$(python -c "filename = '$sig_file_path'.split('/')[-1]; print(filename.split('_')[2].split('-')[0])")

signature=$(cat "$sig_file_path")
filename="${product_name}_${version}_${arch}-setup.exe"

python -c "
import json
import datetime
from collections import OrderedDict
try:
  with open('$update_json_path', 'r+') as f:
    data = json.load(f, object_pairs_hook=OrderedDict)
except FileNotFoundError:
  data = OrderedDict([('version', ''), ('notes', ''), ('pub_date', ''), ('platforms', {'windows-x86_64': {'signature': '', 'url': ''}})])
data['version'] = '$version'
data['notes'] = 'update to ' + '$version'
data['pub_date'] = datetime.datetime.now().isoformat() + 'Z'
data['platforms']['windows-x86_64']['signature'] = '$signature'
data['platforms']['windows-x86_64']['url'] = 'https://proto-assets.s3.amazonaws.com/' + '$product_name' + '/update/' + '$filename'
with open('$update_json_path', 'w') as f:
  json.dump(data, f, indent=4)
"