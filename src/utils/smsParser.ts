import { BankAlertSMSItem } from '../types';

/**
 * Utility to parse raw SMS strings into structured Bank Alert records.
 * Supports Nigerian bank formats (GTBank, Zenith, FirstBank, Access, UBA, Stanbic, Kuda, OPay, PalmPay, etc.)
 */
export function parseBankAlertSMS(
  rawInput: string,
  existingTransactions: Array<{ bankReference?: string; amount?: number; date?: string; memberName?: string }> = []
): BankAlertSMSItem[] {
  if (!rawInput || !rawInput.trim()) return [];

  // Split multi-SMS inputs by double newlines or common message delimiters
  const rawBlocks = rawInput
    .split(/\n\s*\n|(?=(?:Credit|Acct|Txn|Amt|Amount|Bank Alert|CR Alert):)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 15); // filter out tiny artifacts

  const parsedAlerts: BankAlertSMSItem[] = [];
  const seenRefsInBatch = new Set<string>();

  rawBlocks.forEach((sms, idx) => {
    // 1. Amount Extraction
    // Patterns: N25,000.00 | ₦50,000 | NGN 15000 | Amount: 25000.00 | Amt: N10,000 | Credit: N5,000
    let amount = 0;
    const amountMatch = sms.match(/(?:Amt|Amount|Credit|CR|NGN|₦|N)\s*:?\s*(?:N|₦|NGN)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
    if (amountMatch && amountMatch[1]) {
      const cleanAmt = amountMatch[1].replace(/,/g, '');
      amount = parseFloat(cleanAmt) || 0;
    }

    if (amount <= 0) {
      // Fallback amount match for any currency format
      const fallbackAmtMatch = sms.match(/(?:N|₦)\s*([0-9]+(?:\.[0-9]{2})?)/i);
      if (fallbackAmtMatch) {
        amount = parseFloat(fallbackAmtMatch[1]) || 0;
      }
    }

    // 2. Date & Time Extraction
    let dateStr = new Date().toISOString().split('T')[0];
    let timeStr = '12:00';

    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const dateWordMatch = sms.match(/(\d{1,2})[-/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s](\d{4})/i);
    if (dateWordMatch) {
      const day = dateWordMatch[1].padStart(2, '0');
      const month = monthNames[dateWordMatch[2].toLowerCase()] || '01';
      const year = dateWordMatch[3];
      dateStr = `${year}-${month}-${day}`;
    } else {
      const isoDateMatch = sms.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (isoDateMatch) {
        dateStr = `${isoDateMatch[1]}-${isoDateMatch[2].padStart(2, '0')}-${isoDateMatch[3].padStart(2, '0')}`;
      } else {
        const dmyMatch = sms.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
        if (dmyMatch) {
          dateStr = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
        }
      }
    }

    // Time regex: e.g. 14:22:10 or 10:15 AM
    const timeMatch = sms.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/);
    if (timeMatch) {
      timeStr = timeMatch[1].trim();
    }

    // 3. Bank Reference Extraction
    let bankRef = '';
    const refMatch = sms.match(/(?:Ref|Reference|RefNo|TRF|TxnRef|Seq)\s*:?\s*([A-Za-z0-9/_-]{5,30})/i);
    if (refMatch && refMatch[1]) {
      bankRef = refMatch[1].trim();
    } else {
      // Auto-generate reference from hash/timestamp if not explicitly provided
      bankRef = `REF-${Date.now().toString().slice(-6)}${idx + 1}`;
    }

    // 4. Sender Name Extraction
    let senderName = '';
    const senderMatch = sms.match(/(?:From|Sender|Payer|by|Desc:?\s*(?:FBN\/|NIP\/|TRF\/)?)\s*:?\s*([A-Za-z\s]{3,35})(?=\s+(?:Date|Bank|Ref|Desc|Acc|Amt|Time|on|\.|$))/i);
    if (senderMatch && senderMatch[1]) {
      const candidate = senderMatch[1].trim();
      if (!['Credit', 'Debit', 'Account', 'Amount', 'Date', 'Bank'].includes(candidate)) {
        senderName = candidate;
      }
    }

    // 5. Bank Name Detection
    let bankName = 'Commercial Bank';
    const banks = ['GTBank', 'Zenith', 'FirstBank', 'Access Bank', 'UBA', 'Stanbic', 'Kuda', 'OPay', 'PalmPay', 'FCMB', 'Sterling', 'Union Bank', 'Fidelity', 'Wema', 'Polaris', 'Keystone', 'EcoBank'];
    for (const b of banks) {
      if (new RegExp(b, 'i').test(sms)) {
        bankName = b;
        break;
      }
    }

    // 6. Narration / Description Extraction
    let narration = '';
    const descMatch = sms.match(/(?:Desc|Narration|Memo|Details)\s*:?\s*([^.\n]+)/i);
    if (descMatch && descMatch[1]) {
      narration = descMatch[1].trim();
    } else {
      narration = senderName ? `Bank alert from ${senderName}` : `Bank alert transfer ${bankRef}`;
    }

    // 7. Duplicate Check
    let isDuplicate = false;
    let duplicateReason = '';

    const normRef = bankRef.toLowerCase();
    if (seenRefsInBatch.has(normRef)) {
      isDuplicate = true;
      duplicateReason = `Duplicate reference '${bankRef}' detected within current paste batch.`;
    } else if (normRef && existingTransactions.some((t) => t.bankReference?.toLowerCase() === normRef)) {
      isDuplicate = true;
      duplicateReason = `Bank Reference '${bankRef}' is ALREADY POSTED in system transactions ledger!`;
    } else if (amount > 0 && existingTransactions.some((t) => t.amount === amount && t.date === dateStr)) {
      isDuplicate = true;
      duplicateReason = `A transaction with identical amount (₦${amount.toLocaleString()}) and date (${dateStr}) already exists in system.`;
    }

    if (bankRef) {
      seenRefsInBatch.add(normRef);
    }

    parsedAlerts.push({
      id: `alert_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
      rawSms: sms,
      amount,
      date: dateStr,
      time: timeStr,
      senderName: senderName || 'Unknown Sender',
      bankName,
      bankReference: bankRef,
      narration,
      status: 'Pending Member Assignment',
      isDuplicate,
      duplicateReason,
    });
  });

  return parsedAlerts;
}

export const SAMPLE_SMS_PRESETS = [
  {
    title: 'Preset 1: Mixed Bank Alerts (GTBank & Zenith)',
    description: '4 SMS alerts from GTBank and Zenith with sender names and refs',
    text: `Credit: N25,000.00 Acc: 2039****12 Desc: FBN/JOHN ADEBAYO/FEES Date: 05-Aug-2026 14:22:10 Ref: 893402948210

Acct: 2039****12 Amt: N50,000.00 CR Date: 05-08-2026 10:15:00 From: ADEMOLA BALOGUN Ref: POS-984214 Desc: Savings deposit

Credit Alert: N10,000.00 deposited into 2039****12 on 05-Aug-2026 16:45:12 by OLUWASEUN OGUNLEYE. Ref: ACC8493021. Desc: Registration fee

Txn: Credit Amt: N120,000.00 Date: 05/08/2026 11:30 AM From: KALEJAIYE BISOLA Bank: GTBank Ref: TRF/928173612 Desc: Loan repayment principal`,
  },
  {
    title: 'Preset 2: Access & FirstBank Batch with Duplicate Alert',
    description: '3 alerts including 1 duplicate reference to test duplicate detection',
    text: `Credit: N15,000.00 Acc: 2039****12 Desc: NIP/FATIMA USMAN/SAVINGS Date: 05-Aug-2026 09:10:00 Ref: TRF-8899201

Credit: N15,000.00 Acc: 2039****12 Desc: NIP/FATIMA USMAN/SAVINGS Date: 05-Aug-2026 09:10:00 Ref: TRF-8899201

Acct: 2039****12 Amt: N2,500.00 CR Date: 05-08-2026 08:30:00 From: BABATUNDE RAHEEM Ref: FBN-20260805-01 Desc: Registration Fee`,
  },
  {
    title: 'Preset 3: Digital Bank Alerts (OPay & Kuda)',
    description: 'Mobile money transfers from Kuda and OPay',
    text: `Credit N35,000.00 from IBRAHIM MUSA on 05/08/2026. Ref: KUD99401. Memo: Monthly Savings Deposit

Credit N200,000.00 from CHIEF DR OKONKWO EMANUEL on 05/08/2026. Ref: OPY8839201. Memo: Commercial Venture Investment`,
  },
];
