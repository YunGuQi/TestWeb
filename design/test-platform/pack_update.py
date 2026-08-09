import zipfile
import os

def create_update_zip():
    zip_name = 'update.zip'
    targets = ['.next', 'public', 'package.json']
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for target in targets:
            if os.path.isfile(target):
                print(f"Adding file {target}")
                zipf.write(target, arcname=target)
            elif os.path.isdir(target):
                for root, dirs, files in os.walk(target):
                    if 'cache' in root.split(os.sep) or 'dev' in root.split(os.sep):
                        continue
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, start='.')
                        print(f"Adding {arcname}")
                        zipf.write(file_path, arcname=arcname)
    
    print(f"Successfully created {zip_name} with only modified code and assets!")

if __name__ == '__main__':
    create_update_zip()
