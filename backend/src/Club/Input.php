<?php

declare(strict_types=1);

namespace Portal\Club;

/**
 * Collects field errors while reading a JSON body. Pure.
 * Usage: $in = new Input($json); $name = $in->text('name', 60, required: true); $in->throwIfInvalid();
 */
final class Input
{
    /** @var array<string, string> */
    private array $errors = [];

    /** @param array<string, mixed> $data */
    public function __construct(private readonly array $data)
    {
    }

    public function text(string $field, int $max, bool $required = false, string $label = 'Pole'): ?string
    {
        $raw = $this->data[$field] ?? null;
        $value = is_string($raw) || is_int($raw) ? trim(preg_replace('/\s+/u', ' ', (string) $raw) ?? '') : '';
        if ($value === '') {
            if ($required) {
                $this->errors[$field] = "$label je povinné.";
            }
            return null;
        }
        if (mb_strlen($value) > $max) {
            $this->errors[$field] = "$label může mít nejvýš $max znaků.";
            return null;
        }
        return $value;
    }

    /** Y-m-d */
    public function date(string $field, bool $required = false, string $label = 'Datum'): ?\DateTimeImmutable
    {
        $raw = $this->data[$field] ?? null;
        if ($raw === null || $raw === '') {
            if ($required) {
                $this->errors[$field] = "$label je povinné.";
            }
            return null;
        }
        $date = is_string($raw) ? \DateTimeImmutable::createFromFormat('!Y-m-d', $raw) : false;
        if ($date === false || $date->format('Y-m-d') !== $raw || (int) $date->format('Y') < 1900 || (int) $date->format('Y') > 2200) {
            $this->errors[$field] = "$label zadej jako platné datum.";
            return null;
        }
        return $date;
    }

    public function int(string $field, int $min, int $max, bool $required = false, string $label = 'Číslo'): ?int
    {
        $raw = $this->data[$field] ?? null;
        if ($raw === null || $raw === '') {
            if ($required) {
                $this->errors[$field] = "$label je povinné.";
            }
            return null;
        }
        $value = filter_var($raw, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]);
        if ($value === false) {
            $this->errors[$field] = "$label musí být celé číslo od $min do $max.";
            return null;
        }
        return $value;
    }

    /** @param list<string> $allowed */
    public function choice(string $field, array $allowed, string $message): ?string
    {
        $raw = $this->data[$field] ?? null;
        if (!is_string($raw) || !in_array($raw, $allowed, true)) {
            $this->errors[$field] = $message;
            return null;
        }
        return $raw;
    }

    public function error(string $field, string $message): void
    {
        $this->errors[$field] ??= $message;
    }

    public function has(string $field): bool
    {
        return array_key_exists($field, $this->data);
    }

    /** @return array<string, string> */
    public function errors(): array
    {
        return $this->errors;
    }

    /** @throws \Portal\Http\HttpException 422 */
    public function throwIfInvalid(): void
    {
        if ($this->errors) {
            throw \Portal\Http\HttpException::validation($this->errors);
        }
    }
}
