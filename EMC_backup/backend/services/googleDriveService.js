const { google } = require('googleapis');
const { Readable } = require('stream');

let drive;
let ROOT;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    drive = google.drive({ version: 'v3', auth });
    ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  }
} catch (e) {
  console.warn('⚠️ Google Drive Service is not configured.');
}

async function createClaimFolder(claimNumber, claimDate) {
  if (!drive) {
    console.log('[GoogleDrive Stub] createClaimFolder for', claimNumber);
    return { folderId: 'dummy_folder_id', folderUrl: 'https://drive.google.com/drive/folders/dummy' };
  }

  try {
    const date = new Date(claimDate);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = `${month}-${months[date.getMonth()]}`;

    let yearFolder = await findOrCreateFolder(year, ROOT);
    let monthFolder = await findOrCreateFolder(monthName, yearFolder);
    let claimFolder = await findOrCreateFolder(claimNumber, monthFolder);

    const url = `https://drive.google.com/drive/folders/${claimFolder}`;
    return { folderId: claimFolder, folderUrl: url };
  } catch (error) {
    console.error('Google Drive Error:', error);
    return { folderId: 'dummy_folder_id', folderUrl: 'https://drive.google.com/drive/folders/dummy' };
  }
}

async function findOrCreateFolder(name, parentId) {
  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)'
  });
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id'
  });
  return folder.data.id;
}

async function uploadReceipt(fileBuffer, fileName, mimeType, claimNumber, claimDate) {
  if (!drive) {
    console.log('[GoogleDrive Stub] uploadReceipt for', claimNumber);
    return { fileId: 'dummy_file_id', link: '#', thumbnail: '#' };
  }
  
  try {
    const { folderId } = await createClaimFolder(claimNumber, claimDate);

    const file = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType, body: Readable.from(fileBuffer) },
      fields: 'id, webViewLink, thumbnailLink'
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    return { fileId: file.data.id, link: file.data.webViewLink, thumbnail: file.data.thumbnailLink };
  } catch(error) {
     console.error('Google Drive Error:', error);
     return { fileId: 'dummy_file_id', link: '#', thumbnail: '#' };
  }
}

async function uploadPDF(pdfBuffer, fileName, claimNumber, claimDate) {
  return uploadReceipt(pdfBuffer, fileName, 'application/pdf', claimNumber, claimDate);
}

module.exports = { createClaimFolder, uploadReceipt, uploadPDF };
