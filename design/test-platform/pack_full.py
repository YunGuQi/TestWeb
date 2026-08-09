import zipfile
import os
import time

def create_full_zip():
    zip_name = 'deploy_full.zip'
    targets = ['.next', 'public', 'package.json', 'package-lock.json', 'prisma', 'node_modules']
    
    print(f"Creating {zip_name} (this may take a minute)...")
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for target in targets:
            if not os.path.exists(target):
                print(f"Warning: {target} not found, skipping...")
                continue
                
            if os.path.isfile(target):
                print(f"Adding file {target}")
                zipf.write(target, arcname=target)
            elif os.path.isdir(target):
                for root, dirs, files in os.walk(target):
                    # Skip Next.js cache
                    if '.next\\cache' in root or '.next/cache' in root:
                        continue
                    
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, start='.')
                        zipf.write(file_path, arcname=arcname)
    
    print(f"Successfully created {zip_name}!")
    print(f"File size: {os.path.getsize(zip_name) / (1024*1024):.2f} MB")

if __name__ == '__main__':
    start_time = time.time()
    create_full_zip()
    print(f"Time taken: {time.time() - start_time:.2f} seconds")
