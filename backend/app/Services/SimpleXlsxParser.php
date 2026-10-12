<?php

namespace App\Services;

use Exception;
use ZipArchive;
use SimpleXMLElement;

class SimpleXlsxParser
{
    /**
     * Parses an .xlsx file safely using native PHP ZipArchive and SimpleXML.
     * Returns an array of rows, where each row is an array of cell values.
     *
     * @param string $filePath
     * @return array<int, array<int, string>>
     * @throws Exception
     */
    public static function parse(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new Exception("File does not exist: {$filePath}");
        }

        $zip = new ZipArchive();
        $openResult = $zip->open($filePath);
        if ($openResult !== true) {
            throw new Exception("Unable to open Excel archive (error code: {$openResult}).");
        }

        // 1. Read shared strings table if present
        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml !== false) {
            $xml = @simplexml_load_string($sharedStringsXml);
            if ($xml) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Read first worksheet
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $zip->close();
            throw new Exception("Worksheet (sheet1.xml) was not found in the Excel document.");
        }

        $xml = @simplexml_load_string($sheetXml);
        $zip->close();

        if (!$xml || !isset($xml->sheetData)) {
            return [];
        }

        $rows = [];
        foreach ($xml->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $c) {
                $cellRef = (string) $c['r']; // e.g. "A1", "B2"
                preg_match('/^([A-Z]+)(\d+)$/', $cellRef, $matches);
                $colLetters = $matches[1] ?? 'A';
                $colIndex = self::colLetterToIndex($colLetters);

                $type = (string) $c['t'];
                $val = '';

                if ($type === 's') {
                    $idx = (int) $c->v;
                    $val = $sharedStrings[$idx] ?? '';
                } elseif ($type === 'inlineStr' && isset($c->is->t)) {
                    $val = (string) $c->is->t;
                } elseif (isset($c->v)) {
                    $val = (string) $c->v;
                }

                $cells[$colIndex] = trim($val);
            }

            if (!empty($cells)) {
                $maxCol = max(array_keys($cells));
                $rowArr = [];
                for ($i = 0; $i <= $maxCol; $i++) {
                    $rowArr[] = $cells[$i] ?? '';
                }
                $rows[] = $rowArr;
            }
        }

        return $rows;
    }

    /**
     * Converts column letters like 'A', 'B', 'Z', 'AA' into 0-based column indices.
     */
    private static function colLetterToIndex(string $col): int
    {
        $index = 0;
        $len = strlen($col);
        for ($i = 0; $i < $len; $i++) {
            $index = $index * 26 + (ord($col[$i]) - ord('A') + 1);
        }
        return $index - 1;
    }
}
