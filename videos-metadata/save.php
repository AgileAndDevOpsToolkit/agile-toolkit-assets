<?php
header('Content-Type: application/json; charset=utf-8');

const DATA_FILENAME = 'videos-metadata.json';
$dataFile = __DIR__ . DIRECTORY_SEPARATOR . DATA_FILENAME;
$backupFile = __DIR__ . DIRECTORY_SEPARATOR . DATA_FILENAME . '.bak';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Méthode non autorisée. Utilise POST.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || trim($rawBody) === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Corps de requête vide.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($rawBody, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'JSON invalide : ' . json_last_error_msg()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$validationError = validateMetadata($data);
if ($validationError !== null) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'error' => $validationError
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (file_exists($dataFile)) {
    @copy($dataFile, $backupFile);
}

$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Impossible de sérialiser les données JSON.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = file_put_contents($dataFile, $json . PHP_EOL, LOCK_EX);
if ($result === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Impossible d’écrire dans ' . DATA_FILENAME . '. Vérifie les droits du dossier.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'file' => DATA_FILENAME,
    'bytes' => $result,
    'saved_at' => date(DATE_ATOM)
], JSON_UNESCAPED_UNICODE);

function validateMetadata($data): ?string
{
    if (!is_array($data)) {
        return 'La racine du JSON doit être un tableau.';
    }

    foreach ($data as $serieIndex => $serie) {
        if (!is_array($serie)) {
            return "La série #$serieIndex doit être un objet.";
        }

        if (!array_key_exists('serie', $serie) || !is_string($serie['serie'])) {
            return "La série #$serieIndex doit contenir un champ texte 'serie'.";
        }

        if (!array_key_exists('videos', $serie) || !is_array($serie['videos'])) {
            return "La série '{$serie['serie']}' doit contenir un tableau 'videos'.";
        }

        foreach ($serie['videos'] as $videoIndex => $video) {
            if (!is_array($video)) {
                return "La vidéo #$videoIndex de la série '{$serie['serie']}' doit être un objet.";
            }

            foreach (['id_youtube', 'titre', 'description-courte', 'description-moyenne'] as $field) {
                if (!array_key_exists($field, $video) || !is_string($video[$field])) {
                    return "La vidéo #$videoIndex de la série '{$serie['serie']}' doit contenir un champ texte '$field'.";
                }
            }

            foreach (['mots-cles', 'questions-repondues'] as $field) {
                if (!array_key_exists($field, $video) || !is_array($video[$field])) {
                    return "La vidéo #$videoIndex de la série '{$serie['serie']}' doit contenir un tableau '$field'.";
                }

                foreach ($video[$field] as $itemIndex => $item) {
                    if (!is_string($item)) {
                        return "L’élément #$itemIndex du tableau '$field' doit être du texte.";
                    }
                }
            }
        }
    }

    return null;
}
