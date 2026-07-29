const url = 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com/api/admin/generate';
const auth = Buffer.from('admin:Jiasite00').toString('base64');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
  },
  body: JSON.stringify({ count: 1, maxUses: 3 })
})
.then(async res => {
  console.log('Status:', res.status);
  console.log('Headers:', res.headers);
  const text = await res.text();
  console.log('Body:', text);
})
.catch(err => console.error(err));
