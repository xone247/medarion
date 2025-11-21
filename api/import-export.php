<?php
// Data Import/Export System for Medarion Platform
// Handles CSV, JSON, and Excel file processing

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'medarion_platform';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

class DataImportExport {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    // Import data from file
    public function importData($table, $file, $userId = 1) {
        $importId = $this->createImportRecord($table, $file['name'], $file['size'], $userId);
        
        try {
            $this->pdo->beginTransaction();
            
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $data = [];
            
            switch ($extension) {
                case 'csv':
                    $data = $this->parseCSV($file['tmp_name']);
                    break;
                case 'json':
                    $data = $this->parseJSON($file['tmp_name']);
                    break;
                case 'xlsx':
                    $data = $this->parseExcel($file['tmp_name']);
                    break;
                default:
                    throw new Exception('Unsupported file format');
            }
            
            $results = $this->insertData($table, $data);
            
            $this->updateImportRecord($importId, 'completed', $results);
            $this->pdo->commit();
            
            return [
                'success' => true,
                'import_id' => $importId,
                'records_processed' => count($data),
                'records_successful' => $results['successful'],
                'records_failed' => $results['failed'],
                'errors' => $results['errors']
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            $this->updateImportRecord($importId, 'failed', [], $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'import_id' => $importId
            ];
        }
    }
    
    // Export data to file
    public function exportData($table, $format, $filters = [], $userId = 1) {
        $exportId = $this->createExportRecord($table, $format, $filters, $userId);
        
        try {
            $data = $this->getDataForExport($table, $filters);
            
            switch ($format) {
                case 'csv':
                    $fileContent = $this->generateCSV($data);
                    $filename = $table . '_export.csv';
                    break;
                case 'json':
                    $fileContent = json_encode($data, JSON_PRETTY_PRINT);
                    $filename = $table . '_export.json';
                    break;
                case 'xlsx':
                    $fileContent = $this->generateExcel($data);
                    $filename = $table . '_export.xlsx';
                    break;
                default:
                    throw new Exception('Unsupported export format');
            }
            
            $this->updateExportRecord($exportId, 'completed', strlen($fileContent));
            
            return [
                'success' => true,
                'export_id' => $exportId,
                'filename' => $filename,
                'content' => base64_encode($fileContent),
                'size' => strlen($fileContent)
            ];
            
        } catch (Exception $e) {
            $this->updateExportRecord($exportId, 'failed', 0, $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'export_id' => $exportId
            ];
        }
    }
    
    // Parse CSV file
    private function parseCSV($filePath) {
        $data = [];
        $handle = fopen($filePath, 'r');
        
        if ($handle === false) {
            throw new Exception('Could not open CSV file');
        }
        
        $headers = fgetcsv($handle);
        if ($headers === false) {
            throw new Exception('Could not read CSV headers');
        }
        
        while (($row = fgetcsv($handle)) !== false) {
            $data[] = array_combine($headers, $row);
        }
        
        fclose($handle);
        return $data;
    }
    
    // Parse JSON file
    private function parseJSON($filePath) {
        $content = file_get_contents($filePath);
        $data = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON format: ' . json_last_error_msg());
        }
        
        return $data;
    }
    
    // Parse Excel file (simplified - would need PhpSpreadsheet library)
    private function parseExcel($filePath) {
        // This is a simplified implementation
        // In production, use PhpSpreadsheet library
        throw new Exception('Excel import requires PhpSpreadsheet library');
    }
    
    // Insert data into table
    private function insertData($table, $data) {
        $successful = 0;
        $failed = 0;
        $errors = [];
        
        foreach ($data as $index => $record) {
            try {
                $columns = implode(', ', array_keys($record));
                $placeholders = ':' . implode(', :', array_keys($record));
                
                $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
                $stmt = $this->pdo->prepare($sql);
                
                foreach ($record as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                
                $stmt->execute();
                $successful++;
                
            } catch (Exception $e) {
                $failed++;
                $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
            }
        }
        
        return [
            'successful' => $successful,
            'failed' => $failed,
            'errors' => $errors
        ];
    }
    
    // Get data for export
    private function getDataForExport($table, $filters) {
        $sql = "SELECT * FROM $table";
        $params = [];
        
        if (!empty($filters)) {
            $conditions = [];
            foreach ($filters as $key => $value) {
                $conditions[] = "$key = :$key";
                $params[$key] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Generate CSV content
    private function generateCSV($data) {
        if (empty($data)) {
            return '';
        }
        
        $output = fopen('php://temp', 'r+');
        
        // Write headers
        fputcsv($output, array_keys($data[0]));
        
        // Write data
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
    
    // Generate Excel content (simplified)
    private function generateExcel($data) {
        // This is a simplified implementation
        // In production, use PhpSpreadsheet library
        return json_encode($data);
    }
    
    // Create import record
    private function createImportRecord($table, $filename, $fileSize, $userId) {
        $sql = "INSERT INTO data_imports (user_id, table_name, file_name, file_size, status) VALUES (?, ?, ?, ?, 'pending')";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $table, $filename, $fileSize]);
        
        return $this->pdo->lastInsertId();
    }
    
    // Update import record
    private function updateImportRecord($importId, $status, $results = [], $errorLog = null) {
        $sql = "UPDATE data_imports SET status = ?, records_processed = ?, records_successful = ?, records_failed = ?, error_log = ?, completed_at = NOW() WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        $recordsProcessed = isset($results['successful']) ? $results['successful'] + $results['failed'] : 0;
        $recordsSuccessful = $results['successful'] ?? 0;
        $recordsFailed = $results['failed'] ?? 0;
        $errorLog = $errorLog ?: (isset($results['errors']) ? implode("\n", $results['errors']) : null);
        
        $stmt->execute([$status, $recordsProcessed, $recordsSuccessful, $recordsFailed, $errorLog, $importId]);
    }
    
    // Create export record
    private function createExportRecord($table, $format, $filters, $userId) {
        $sql = "INSERT INTO data_exports (user_id, table_name, filters, status) VALUES (?, ?, ?, 'pending')";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $table, json_encode($filters)]);
        
        return $this->pdo->lastInsertId();
    }
    
    // Update export record
    private function updateExportRecord($exportId, $status, $fileSize, $errorLog = null) {
        $sql = "UPDATE data_exports SET status = ?, file_size = ?, records_exported = ?, error_log = ?, created_at = NOW() WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        
        $recordsExported = $fileSize > 0 ? 1 : 0; // Simplified
        
        $stmt->execute([$status, $fileSize, $recordsExported, $errorLog, $exportId]);
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove 'api/import-export' from path
if (count($pathParts) >= 2 && $pathParts[0] === 'api' && $pathParts[1] === 'import-export') {
    $pathParts = array_slice($pathParts, 2);
}

$table = $pathParts[0] ?? '';
$action = $pathParts[1] ?? '';

$importExport = new DataImportExport($pdo);

try {
    switch ($method) {
        case 'POST':
            if ($action === 'import') {
                if (!isset($_FILES['file'])) {
                    throw new Exception('No file uploaded');
                }
                
                $result = $importExport->importData($table, $_FILES['file']);
            } elseif ($action === 'export') {
                $format = $_POST['format'] ?? 'csv';
                $filters = json_decode($_POST['filters'] ?? '{}', true);
                
                $result = $importExport->exportData($table, $format, $filters);
            } else {
                throw new Exception('Invalid action');
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>


