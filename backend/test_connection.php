<?php
/**
 * EduConnect - XAMPP & MySQL Database Connection Diagnostic Tool
 * 
 * Open this page in your browser at:
 * http://localhost/educonnect/backend/test_connection.php
 */

require_once __DIR__ . '/config/db.php';

$connectionError = null;
$pdo = null;
$tablesStatus = [];
$totalRows = 0;

try {
    $pdo = getDbConnection();
    
    // Required tables in EduConnect
    $expectedTables = [
        'users' => 'Users & Auth Accounts',
        'categories' => 'Opportunity Categories',
        'universities' => 'Universities & Campuses',
        'university_intakes' => 'Upcoming Intakes & Deadlines',
        'university_news' => 'Campus News & Bulletins',
        'opportunities' => 'Opportunities (Scholarships, Courses, etc.)',
        'events' => 'Academic Seminars & Workshops',
        'applications' => 'Student Applications',
        'saved_opportunities' => 'Bookmarks / Saved Opportunities'
    ];

    foreach ($expectedTables as $table => $label) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM `{$table}`");
            $count = $stmt->fetchColumn();
            $tablesStatus[$table] = [
                'exists' => true,
                'count'  => (int)$count,
                'label'  => $label
            ];
            $totalRows += (int)$count;
        } catch (Exception $e) {
            $tablesStatus[$table] = [
                'exists' => false,
                'count'  => 0,
                'label'  => $label,
                'error'  => $e->getMessage()
            ];
        }
    }
} catch (Exception $e) {
    $connectionError = $e->getMessage();
}

$phpVersion = phpversion();
$mysqlVersion = $pdo ? $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) : 'Disconnected';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduConnect - Backend Diagnostics</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body class="bg-light py-5">
<div class="container" style="max-width: 800px;">

    <div class="card shadow-sm border-0 rounded-3 mb-4">
        <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
                        <i class="bi bi-database-check fs-4"></i>
                    </div>
                    <div>
                        <h4 class="mb-0 fw-bold text-dark">EduConnect Backend Diagnostic</h4>
                        <span class="text-muted small">XAMPP / MySQL / PHP Connection Validator</span>
                    </div>
                </div>
                <div>
                    <?php if (!$connectionError && empty(array_filter($tablesStatus, fn($t) => !$t['exists']))): ?>
                        <span class="badge bg-success px-3 py-2 fs-6"><i class="bi bi-check-circle-fill me-1"></i> Connected & Ready</span>
                    <?php else: ?>
                        <span class="badge bg-danger px-3 py-2 fs-6"><i class="bi bi-exclamation-triangle-fill me-1"></i> Action Required</span>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Server Info Pills -->
            <div class="row g-3 mb-4">
                <div class="col-sm-4">
                    <div class="p-3 bg-white border rounded">
                        <div class="text-muted small">PHP Version</div>
                        <div class="fw-bold text-dark"><?= htmlspecialchars($phpVersion) ?></div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="p-3 bg-white border rounded">
                        <div class="text-muted small">MySQL Version</div>
                        <div class="fw-bold text-dark"><?= htmlspecialchars($mysqlVersion) ?></div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="p-3 bg-white border rounded">
                        <div class="text-muted small">Total Seed Records</div>
                        <div class="fw-bold text-primary"><?= $totalRows ?> rows</div>
                    </div>
                </div>
            </div>

            <!-- Connection Status -->
            <?php if ($connectionError): ?>
                <div class="alert alert-danger d-flex align-items-start gap-2">
                    <i class="bi bi-x-octagon-fill fs-5 mt-0.5"></i>
                    <div>
                        <strong>Database Connection Failed:</strong><br>
                        <code><?= htmlspecialchars($connectionError) ?></code>
                        <div class="mt-2 small text-dark">
                            <strong>How to fix:</strong>
                            <ol class="mb-0 ps-3">
                                <li>Open <strong>XAMPP Control Panel</strong> and click <strong>Start</strong> next to MySQL and Apache.</li>
                                <li>Open phpMyAdmin at <a href="http://localhost/phpmyadmin/" target="_blank">http://localhost/phpmyadmin/</a>.</li>
                                <li>Click <strong>Import</strong> tab, select the <code>database/educonnect.sql</code> file, and click <strong>Go</strong>.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-success d-flex align-items-center gap-2 mb-4">
                    <i class="bi bi-check-circle-fill fs-5"></i>
                    <div>
                        PDO connection to database <strong><?= DB_NAME ?></strong> on <strong><?= DB_HOST ?>:<?= DB_PORT ?></strong> was successful!
                    </div>
                </div>
            <?php endif; ?>

            <!-- Table Verification -->
            <h5 class="fw-bold mb-3 text-dark">Database Tables Status</h5>
            <div class="table-responsive">
                <table class="table table-bordered align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Table Name</th>
                            <th>Description</th>
                            <th class="text-center" style="width: 120px;">Status</th>
                            <th class="text-end" style="width: 100px;">Rows</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($tablesStatus as $tableName => $status): ?>
                            <tr>
                                <td><code><?= htmlspecialchars($tableName) ?></code></td>
                                <td class="small text-muted"><?= htmlspecialchars($status['label']) ?></td>
                                <td class="text-center">
                                    <?php if ($status['exists']): ?>
                                        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check me-1"></i>OK</span>
                                    <?php else: ?>
                                        <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-x me-1"></i>Missing</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-end fw-semibold">
                                    <?= $status['count'] ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Quick Links -->
            <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                <a href="../index.html" class="btn btn-primary"><i class="bi bi-arrow-left me-1"></i> Go to EduConnect Frontend</a>
                <a href="http://localhost/phpmyadmin/" target="_blank" class="btn btn-outline-secondary"><i class="bi bi-box-arrow-up-right me-1"></i> Open phpMyAdmin</a>
            </div>

        </div>
    </div>

</div>
</body>
</html>
