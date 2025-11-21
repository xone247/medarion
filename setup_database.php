<?php
// Database setup script for Medarion Platform
// This script creates the database and tables

// Database configuration
$host = 'localhost';
$username = 'root';
$password = ''; // Default XAMPP MySQL password is empty
$database = 'medarion_platform';

try {
    // Connect to MySQL server (without specifying database)
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to MySQL server successfully.<br>";
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $database");
    echo "Database '$database' created successfully.<br>";
    
    // Connect to the specific database
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database '$database' successfully.<br>";
    
    // Read and execute the SQL file
    $sql = file_get_contents('create_database.sql');
    
    // Split the SQL into individual statements
    $statements = explode(';', $sql);
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                echo "Executed: " . substr($statement, 0, 50) . "...<br>";
            } catch (PDOException $e) {
                echo "Error executing statement: " . $e->getMessage() . "<br>";
            }
        }
    }
    
    echo "<br>Database setup completed successfully!<br>";
    echo "<a href='index.html'>Go to Medarion Platform</a>";
    
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "<br>";
    echo "Please make sure XAMPP MySQL is running and accessible.<br>";
}
?>
