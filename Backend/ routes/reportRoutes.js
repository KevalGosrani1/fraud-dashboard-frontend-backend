const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog'); // ✅ Import AuditLog
const { sendEmailAlert } = require('../utils/emailAlert');
const { alertServices } = require('../utils/alertService');
const { sendMessage } = require('../utils/producer');

// POST /api/reports
router.post('/', async (req, res) => {
  const payload = req.body;
  console.log('🚨 /api/reports HIT');
  console.log('📦 Payload:', JSON.stringify(payload));

  // Capture requester identity (email or IP)
  const userIdentity =
    req.user?.email ||
    req.headers['x-forwarded-for'] ||
    req.ip ||
    'unknown';

  try {
    if (Array.isArray(payload)) {
      console.log('📝 Inserting multiple reports...');
      const savedReports = await Report.insertMany(payload);
      console.log(`✅ Inserted ${savedReports.length} reports`);

      // Fire-and-forget parallel post-processing
      for (const report of savedReports) {
        (async () => {
          try {
            console.log(`📡 Publishing Kafka for report ${report._id}`);
            await sendMessage('fraud-reports', {
              wallet: report.wallet,
              reason: report.reason,
              severity: report.severity,
              reportId: report._id,
              createdAt: report.createdAt
            });

            // ✅ Audit Log
            await AuditLog.create({
              user: userIdentity,
              wallet: report.wallet,
              riskLevel: report.riskLevel || 'unknown'
            });

            if (report.severity >= 4) {
              console.log(`✉️ Sending email alert for severity ${report.severity}`);
              await sendEmailAlert({
                to: process.env.ALERT_EMAIL,
                subject: 'High Severity Fraud Report',
                text: `High severity report submitted:\nWallet: ${report.wallet}\nReason: ${report.reason}`
              });
            }

            if (report.riskLevel === 'high') {
              console.log(`🚨 Triggering alert service for report ${report._id}`);
              await alertServices(report.wallet, report._id);
            }
          } catch (err) {
            console.error(`❌ Error in post-processing for report ${report._id}:`, err);
          }
        })();
      }

      res.status(201).json({
        message: 'Reports created successfully',
        reports: savedReports
      });
    } else {
      console.log('📝 Inserting single report...');
      const report = new Report(payload);
      await report.save();
      console.log(`✅ Report ${report._id} saved`);

      // Fire-and-forget post-processing
      (async () => {
        try {
          console.log(`📡 Publishing Kafka for report ${report._id}`);
          await sendMessage('fraud-reports', {
            wallet: report.wallet,
            reason: report.reason,
            severity: report.severity,
            reportId: report._id,
            createdAt: report.createdAt
          });

          // ✅ Audit Log
          await AuditLog.create({
            user: userIdentity,
            wallet: report.wallet,
            riskLevel: report.riskLevel || 'unknown'
          });

          if (report.severity >= 4) {
            console.log(`✉️ Sending email alert for severity ${report.severity}`);
            await sendEmailAlert({
              to: process.env.ALERT_EMAIL,
              subject: 'High Severity Fraud Report',
              text: `High severity report submitted:\nWallet: ${report.wallet}\nReason: ${report.reason}`
            });
          }

          if (report.riskLevel === 'high') {
            console.log(`🚨 Triggering alert service for report ${report._id}`);
            await alertServices(report.wallet, report._id);
          }
        } catch (err) {
          console.error(`❌ Error in post-processing for report ${report._id}:`, err);
        }
      })();

      res.status(201).json({
        message: 'Report created successfully',
        report
      });
    }
  } catch (error) {
    console.error('❌ Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// ✅ GET /api/reports?user_email=<email>
router.get('/', async (req, res) => {
  const { user_email } = req.query;
  console.log(`🧭 GET /api/reports for user_email=${user_email}`);

  if (!user_email) {
    return res.status(400).json({ error: 'Missing user_email query parameter' });
  }

  try {
    const reports = await Report.find({ user_email }).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ✅ GET /api/reports/audit-logs
router.get('/audit-logs', async (req, res) => {
  console.log('🧭 GET /api/reports/audit-logs');
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ logs });
  } catch (err) {
    console.error('❌ Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
