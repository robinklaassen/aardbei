<?php

// This page functions as a front door to AARDBEI. Select a camp and then load the application with the camp (using a GET parameter)

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
$q = mysqli_query($link, "SELECT events.id, events.naam as campName, events.datum_voordag, locations.plaats FROM events JOIN locations ON events.location_id = locations.id WHERE events.type = 'kamp' ORDER BY events.datum_start DESC");

$camps = [];
while ($r = mysqli_fetch_array($q)) {
	$camps[] = [
		'id' => $r['id'],
		'name' => $r['campName'],
		'year' => substr($r['datum_voordag'], 0, 4),
		'loc' => $r['plaats']
	];
}

?>

<!DOCTYPE html>
<html>

<head>
	<meta charset="UTF-8">
	<title>AARDBEI 3.0 - Roostersysteem Anderwijs</title>
	<link rel="shortcut icon" href="strawberry.ico">
	<meta name="author" content="Robin Klaassen">

	<!-- load CSS -->
	<link href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.5/yeti/bootstrap.min.css" rel="stylesheet">
	<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css" rel="stylesheet">
	<link rel="stylesheet" href="css/style.css">

</head>

<body>

	<!-- Container and root panel -->
	<div class="container">
		<div class="row">
			<div class="col-md-8 col-md-offset-2">
				<div id="root" class="panel panel-primary">
					<!-- Panel head -->
					<div class="panel-heading">
						<h3 class="text-center" style="margin: 10px 0;">AARDBEI 3.0 &mdash; kamp kiezen</h3>
					</div>

					<!-- Panel body -->
					<div class="panel-body">
						<select id="select-camp" class="form-control">
							<?php
							foreach ($camps as $c) {
								echo "<option value='" . $c['id'] . "'>" . $c['name'] . " " . $c['year'] . " (" . $c['loc'] . ")</option>";
							}
							?>
						</select>

						<br />

						<button type="submit" class="btn btn-default btn-block">Gaan met die banaan!</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Javascript -->
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

	<script type="text/javascript">
		$(function() {
			$("button").click(function() {
				var id = $("#select-camp").val();
				window.location.href = "http://aardbei.anderwijs.nl/app.html?id=" + id;
			});
		});
	</script>

</body>

</html>