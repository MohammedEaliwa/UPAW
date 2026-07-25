<?php

namespace App\Services;

class AiTranslationService
{
    /**
     * Translate text from source language to target language using AI.
     * Supports HTML content by chunking and preserving markup structure.
     *
     * @param string $text
     * @param string $source
     * @param string $target
     * @return string
     */
    public static function translateText(string $text, string $source = 'ar', string $target = 'en'): string
    {
        $trimmed = trim($text);
        if ($trimmed === '') {
            return $text;
        }

        // If source and target are identical, return original
        if ($source === $target) {
            return $text;
        }

        try {
            // Check if string contains HTML tags
            if (preg_match('/<[^>]+>/', $trimmed)) {
                return self::translateHtml($trimmed, $source, $target);
            }

            return self::translateRawChunk($trimmed, $source, $target);
        } catch (\Throwable $e) {
            error_log('AI Translation Warning: ' . $e->getMessage());
            return $text;
        }
    }

    /**
     * Translates a plain text string chunk via Google Translate GTX API.
     */
    public static function translateRawChunk(string $text, string $source, string $target): string
    {
        $trimmed = trim($text);
        if ($trimmed === '') {
            return $text;
        }

        // Limit max length per request chunk to 3500 characters
        if (mb_strlen($trimmed) > 3500) {
            $chunks = str_split($trimmed, 3000);
            $translatedParts = [];
            foreach ($chunks as $chunk) {
                $translatedParts[] = self::translateRawChunk($chunk, $source, $target);
            }
            return implode(' ', $translatedParts);
        }

        $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl='
            . urlencode($source) . '&tl=' . urlencode($target) . '&dt=t&q=' . urlencode($trimmed);

        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n",
                'timeout' => 8,
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ]
        ];

        $context = stream_context_create($opts);
        $jsonStr = @file_get_contents($url, false, $context);

        if (!$jsonStr) {
            return $text;
        }

        $data = json_decode($jsonStr, true);
        if (!is_array($data) || empty($data[0])) {
            return $text;
        }

        $result = '';
        foreach ($data[0] as $sentence) {
            if (isset($sentence[0])) {
                $result .= $sentence[0];
            }
        }

        return $result !== '' ? $result : $text;
    }

    /**
     * Translates HTML content preserving markup tags.
     */
    private static function translateHtml(string $html, string $source, string $target): string
    {
        $parts = preg_split('/(<[^>]+>)/', $html, -1, PREG_SPLIT_DELIM_CAPTURE);
        if (!is_array($parts)) {
            return self::translateRawChunk(strip_tags($html), $source, $target);
        }

        $result = '';
        foreach ($parts as $part) {
            if (str_starts_with($part, '<') && str_ends_with($part, '>')) {
                // HTML Tag — keep unchanged
                $result .= $part;
            } else {
                // Text node — translate if non-whitespace
                if (trim($part) !== '') {
                    $result .= self::translateRawChunk($part, $source, $target);
                } else {
                    $result .= $part;
                }
            }
        }

        return $result;
    }

    /**
     * Auto translates matching field pairs in a data array.
     * Example fieldPairs: ['title_ar' => 'title_en', 'content_ar' => 'content_en']
     *
     * @param array $data Reference to input data array
     * @param array $fieldPairs Array of [ 'ar_key' => 'en_key' ]
     * @return array Modified data array
     */
    public static function autoTranslateData(array &$data, array $fieldPairs): array
    {
        foreach ($fieldPairs as $arKey => $enKey) {
            $arVal = trim($data[$arKey] ?? '');
            $enVal = trim($data[$enKey] ?? '');

            // If AR value exists and EN value is empty or identical to AR, translate AR -> EN
            if ($arVal !== '' && ($enVal === '' || $enVal === $arVal)) {
                $data[$enKey] = self::translateText($arVal, 'ar', 'en');
            }
            // If EN value exists and AR value is empty or identical to EN, translate EN -> AR
            elseif ($enVal !== '' && ($arVal === '' || $arVal === $enVal)) {
                $data[$arKey] = self::translateText($enVal, 'en', 'ar');
            }
        }

        return $data;
    }
}
