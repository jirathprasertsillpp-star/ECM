const { google } = require('googleapis');

let sheets;
let SS_ID;

try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    sheets = google.sheets({ version: 'v4', auth });
    SS_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  }
} catch (e) {
  console.warn('⚠️ Google Sheets Service is not configured.');
}

const SHEETS = {
  claims:   'Claims',
  items:    'Expense Items',
  fuel:     'Fuel Report',
  approval: 'Approval Log',
};

async function syncClaim(claim, items) {
  if (!sheets) {
    console.log('[GoogleSheets Stub] syncClaim for', claim.claim_number);
    return;
  }

  try {
    const row = [
      claim.claim_number, claim.status,
      claim.project_name, claim.project_code || '',
      claim.submitter_name || '-', claim.total_amount,
      new Date(claim.created_at).toLocaleDateString('th-TH'),
      claim.drive_folder_url || '',
      new Date().toLocaleString('th-TH')
    ];

    await appendOrUpdate(SHEETS.claims, claim.claim_number, row);

    // Sync items
    if(items && items.length > 0) {
      for (const item of items) {
        const itemRow = [
          claim.claim_number, item.category_th || item.category || '',
          item.description || '', item.vendor_name || '',
          item.amount, item.item_date ? new Date(item.item_date).toLocaleDateString('th-TH') : '',
          item.receipt_drive_link || '', item.ocr_confidence ? `${Math.round(item.ocr_confidence * 100)}%` : ''
        ];
        await sheets.spreadsheets.values.append({
          spreadsheetId: SS_ID,
          range: `${SHEETS.items}!A:I`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [itemRow] }
        });
      }
    }

    await markSynced(claim.id);
  } catch (error) {
     console.error('Google Sheets Error:', error);
  }
}

async function syncApprovalLog(claimNumber, action, approverName, channel, newStatus) {
  const row = [
    claimNumber, action, approverName, channel, newStatus,
    new Date().toLocaleString('th-TH')
  ];
  
  if (!sheets) {
    console.log(`[GoogleSheets Stub] Sync approval log: ${row.join(', ')}`);
    return;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SS_ID,
      range: `${SHEETS.approval}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
  } catch(error) {
     console.error('Google Sheets Error:', error);
  }
}

async function appendOrUpdate(sheetName, identifier, rowData) {
  if (!sheets) return;
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SS_ID,
      range: `${sheetName}!A:A`
    });
    const rows = existing.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === identifier);

    if (rowIndex >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SS_ID,
        range: `${sheetName}!A${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SS_ID,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowData] }
      });
    }
  } catch (err) {
    console.error('appendOrUpdate Error:', err);
  }
}

async function markSynced(claimId) {
  const db = require('../config/database');
  await db.query('UPDATE expense_claims SET sheets_synced = TRUE WHERE id = $1', [claimId]);
}

module.exports = { syncClaim, syncApprovalLog };
