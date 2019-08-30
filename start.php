<?php
// Obtain startup data (camp data and course list) from AAS and output as JSON object

$config = parse_ini_file('config.ini');

$link = mysqli_connect(
	$config['DB_HOST'],
	$config['DB_USERNAME'],
	$config['DB_PASSWORD'],
	$config['DB_DATABASE']
);

if (!$link) {
	die('Connect Error (' . mysqli_connect_errno() . ') '
		. mysqli_connect_error());
}

# Get camp information
$id = $_GET['id'];
$q = mysqli_query($link, "SELECT events.id, events.naam as campName, events.datum_voordag, locations.plaats FROM events JOIN locations ON events.location_id = locations.id WHERE events.type = 'kamp' AND events.id = $id");

$r = mysqli_fetch_array($q);
$id = $r['id'];
$camp = [
	'id' => $r['id'],
	'name' => $r['campName'],
	'year' => substr($r['datum_voordag'], 0, 4),
	'loc' => $r['plaats']
];

# Member information
$members = [];
$q = mysqli_query($link, "SELECT * from members JOIN event_member ON members.id = event_member.member_id WHERE event_member.event_id = $id ORDER BY members.voornaam");
while ($r = mysqli_fetch_array($q)) {

	$m_id = $r['id'];
	$crs = [];
	$string = "";
	$q2 = mysqli_query($link, "SELECT course_member.course_id, course_member.klas, courses.code from course_member JOIN courses ON course_member.course_id = courses.id WHERE member_id = $m_id ORDER BY naam");
	while ($r2 = mysqli_fetch_array($q2)) {
		$crs[] = [
			'id' => $r2['course_id'],
			'level' => $r2['klas']
		];
		$string .= $r2['code'] . ' (' . $r2['klas'] . ')<br/>';
	}

	$members[] = [
		'id' => $m_id,
		'firstName' => utf8_encode($r['voornaam']),
		'fullName' => utf8_encode(trim($r['voornaam'] . ' ' . $r['tussenvoegsel'] . ' ' . $r['achternaam'])),
		'temp' => $r['wissel'],
		'coverage' => $crs,
		'coverageString' => $string
	];
}

# Participant information
$participants = [];
$q = mysqli_query($link, "SELECT * from participants JOIN event_participant ON participants.id = event_participant.participant_id WHERE event_participant.event_id = $id AND event_participant.geplaatst = 1 ORDER BY participants.voornaam");
while ($r = mysqli_fetch_array($q)) {
	$participants[] = [
		'id' => $r['id'],
		'firstName' => utf8_encode($r['voornaam']),
		'fullName' => utf8_encode(trim($r['voornaam'] . ' ' . $r['tussenvoegsel'] . ' ' . $r['achternaam'])),
		'level' => $r['klas'],
		'levelType' => $r['niveau']
	];
}

# Courses
$q = mysqli_query($link, "SELECT * FROM courses ORDER BY naam");
while ($r = mysqli_fetch_array($q)) {
	$courseArray[] = [
		'id' => $r['id'],
		'name' => $r['naam']
	];
	$courseCode[$r['id']] = $r['code'];
}

echo json_encode([
	'camp' => $camp,
	'members' => $members,
	'participants' => $participants,
	'courseArray' => $courseArray,
	'courseCode' => $courseCode
]);

mysqli_close($link);
