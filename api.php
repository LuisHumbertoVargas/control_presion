<?php
$host = "db.uazlzqlxlcydeygpmreo.supabase.co";
$db   = "control_presion_db"; 
$user = "postgres";
$pass = "Catehe0989#";          
$port = "5432";

try {
    $conn = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}

$action = $_GET['action'] ?? '';

if ($action === 'guardar') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO registros (fecha,hora,sistolica,diastolica,pulso,estado,observaciones) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$data['fecha'], $data['hora'], $data['sis'], $data['dia'], $data['pul'], $data['estado'], $data['obs']]);
    echo json_encode(["success" => true]);
}

if ($action === 'listar') {
    $stmt = $conn->query("SELECT * FROM registros ORDER BY fecha,hora");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
}

if ($action === 'borrar') {
    $id = intval($_GET['id']);
    $stmt = $conn->prepare("DELETE FROM registros WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true]);
}
?>
