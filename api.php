<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "presion_db";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

$action = $_GET['action'] ?? '';

if ($action === 'guardar') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO registros (fecha,hora,sistolica,diastolica,pulso,estado,observaciones) VALUES (?,?,?,?,?,?,?)");
    $stmt->bind_param("ssiiiss", $data['fecha'], $data['hora'], $data['sis'], $data['dia'], $data['pul'], $data['estado'], $data['obs']);
    $stmt->execute();
    echo json_encode(["success" => true]);
}

if ($action === 'listar') {
    $result = $conn->query("SELECT * FROM registros ORDER BY fecha,hora");
    $rows = [];
    while($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode($rows);
}

if ($action === 'borrar') {
    $id = intval($_GET['id']);
    $conn->query("DELETE FROM registros WHERE id=$id");
    echo json_encode(["success" => true]);
}
?>
