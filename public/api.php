<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// إعدادات قاعدة البيانات التي زودتني بها
$host = 'sql100.infinityfree.com';
$db   = 'if0_41270364_tremsahdata';
$user = 'if0_41270364';
$pass = 's0955563603';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     // إجبار الاتصال على استخدام الترميز العربي الصحيح
     $pdo->exec("set names utf8mb4");
     
     // محاولة إصلاح ترميز الجداول في حال كانت قديمة (تعمل لمرة واحدة)
     $pdo->exec("ALTER DATABASE if0_41270364_tremsahdata CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
     $pdo->exec("ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
     $pdo->exec("ALTER TABLE ads CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
     $pdo->exec("ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
} catch (\PDOException $e) {
     echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
     exit;
}

$action = $_GET['action'] ?? '';

// 1. تسجيل الدخول
if ($action == 'login' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT * FROM users WHERE identifier = ?");
    $stmt->execute([$input['identifier']]);
    $user = $stmt->fetch();

    if ($user && password_verify($input['password'], $user['password'])) {
        if ($user['is_verified'] == 0) {
            http_response_code(403);
            echo json_encode(['error' => 'يرجى تأكيد حسابك أولاً. تم إرسال رمز التأكيد إلى بريدك الإلكتروني.']);
            exit;
        }
        unset($user['password']);
        unset($user['verification_code']);
        echo json_encode($user);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'بيانات الدخول غير صحيحة']);
    }
}

// 2. التسجيل (المستخدم يختار كلمة السر)
if ($action == 'register' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // التحقق إذا كان المستخدم موجوداً
    $stmt = $pdo->prepare("SELECT id FROM users WHERE identifier = ?");
    $stmt->execute([$input['identifier']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'هذا الحساب مسجل مسبقاً']);
        exit;
    }

    // تشفير كلمة السر المختارة
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
    // توليد رمز تأكيد مكون من 6 أرقام
    $verificationCode = rand(100000, 999999);

    $stmt = $pdo->prepare("INSERT INTO users (identifier, name, password, verification_code, is_verified) VALUES (?, ?, ?, ?, 0)");
    $stmt->execute([$input['identifier'], $input['name'], $hashedPassword, $verificationCode]);
    
    // إرسال رمز التأكيد بالبريد الإلكتروني
    $to = $input['identifier'];
    $subject = "رمز تأكيد حسابك في أسواق تريمسة";
    $message = "أهلاً بك " . $input['name'] . ".\n\nرمز التأكيد الخاص بك هو: " . $verificationCode . "\n\nيرجى إدخال هذا الرمز في الموقع لتفعيل حسابك.";
    
    $headers = "From: Tremsah Market <noreply@treamsh.free.nf>\r\n";
    $headers .= "Reply-To: noreply@treamsh.free.nf\r\n";
    $headers .= "Return-Path: noreply@treamsh.free.nf\r\n";
    $headers .= "X-Priority: 3\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    $mailSent = @mail($to, $subject, $message, $headers);

    echo json_encode([
        'status' => 'success', 
        'message' => 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني للحصول على رمز التأكيد.',
        'debug_code' => $mailSent ? null : $verificationCode // يظهر فقط في حال فشل السيرفر في الإرسال
    ]);
}

// 3. تأكيد الحساب
if ($action == 'verify' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT id FROM users WHERE identifier = ? AND verification_code = ?");
    $stmt->execute([$input['identifier'], $input['code']]);
    $user = $stmt->fetch();

    if ($user) {
        $stmt = $pdo->prepare("UPDATE users SET is_verified = 1 WHERE id = ?");
        $stmt->execute([$user['id']]);
        echo json_encode(['status' => 'success', 'message' => 'تم تأكيد الحساب بنجاح. يمكنك الآن تسجيل الدخول.']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'رمز التأكيد غير صحيح']);
    }
}

// 4. تسجيل الدخول عبر جوجل
if ($action == 'google_login' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'];
    $name = $input['name'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE identifier = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // إنشاء مستخدم جديد مسجل عبر جوجل
        $stmt = $pdo->prepare("INSERT INTO users (identifier, name, is_verified, auth_provider) VALUES (?, ?, 1, 'google')");
        $stmt->execute([$email, $name]);
        $id = $pdo->lastInsertId();
        $user = ['id' => $id, 'identifier' => $email, 'name' => $name, 'is_verified' => 1, 'auth_provider' => 'google'];
    } else {
        unset($user['password']);
        unset($user['verification_code']);
    }
    echo json_encode($user);
    exit;
}

// 5. جلب الإعلانات
if ($action == 'get_ads' && $_SERVER['REQUEST_METHOD'] == 'GET') {
    $category = $_GET['category'] ?? 'all';
    $sql = "SELECT * FROM ads WHERE 1=1";
    $params = [];

    if ($category != 'all') {
        $sql .= " AND category = ?";
        $params[] = $category;
    }

    if (!empty($_GET['minPrice'])) {
        $sql .= " AND price >= ?";
        $params[] = (int)$_GET['minPrice'];
    }
    if (!empty($_GET['maxPrice'])) {
        $sql .= " AND price <= ?";
        $params[] = (int)$_GET['maxPrice'];
    }
    if (!empty($_GET['minArea'])) {
        $sql .= " AND area >= ?";
        $params[] = (int)$_GET['minArea'];
    }
    if (!empty($_GET['maxArea'])) {
        $sql .= " AND area <= ?";
        $params[] = (int)$_GET['maxArea'];
    }
    if (!empty($_GET['rooms'])) {
        $sql .= " AND rooms = ?";
        $params[] = (int)$_GET['rooms'];
    }
    if (!empty($_GET['carType'])) {
        $sql .= " AND car_type LIKE ?";
        $params[] = "%" . $_GET['carType'] . "%";
    }
    if (!empty($_GET['carModel'])) {
        $sql .= " AND car_model LIKE ?";
        $params[] = "%" . $_GET['carModel'] . "%";
    }
    if (!empty($_GET['minYear'])) {
        $sql .= " AND car_year >= ?";
        $params[] = (int)$_GET['minYear'];
    }
    if (!empty($_GET['maxYear'])) {
        $sql .= " AND car_year <= ?";
        $params[] = (int)$_GET['maxYear'];
    }
    
    $sql .= " ORDER BY created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
}

// 4. نشر إعلان
if ($action == 'post_ad' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $sql = "INSERT INTO ads (user_id, category, title, description, price, contact_phone, image_url, rooms, area, car_type, car_model, car_year, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['user_id'], $input['category'], $input['title'], $input['description'], 
        $input['price'], $input['contact_phone'], $input['image_url'], 
        $input['rooms'] ?? null, $input['area'] ?? null, 
        $input['car_type'] ?? null, $input['car_model'] ?? null, $input['car_year'] ?? null
    ]);
    
    echo json_encode(['status' => 'success']);
}

// 5. حذف إعلان
if ($action == 'delete_ad' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM ads WHERE id = ? AND user_id = ?");
    $stmt->execute([$input['ad_id'], $input['user_id']]);
    echo json_encode(['status' => 'success']);
}

// 6. تأشير كـ "تم البيع"
if ($action == 'mark_sold' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE ads SET status = 'sold' WHERE id = ? AND user_id = ?");
    $stmt->execute([$input['ad_id'], $input['user_id']]);
    echo json_encode(['status' => 'success']);
}

// 7. اتصل بنا
if ($action == 'contact' && $_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO messages (name, identifier, subject, message) VALUES (?, ?, ?, ?)");
    $stmt->execute([$input['name'], $input['identifier'], $input['subject'], $input['message']]);
    echo json_encode(['status' => 'success']);
}
?>
