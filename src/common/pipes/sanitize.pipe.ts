import { PipeTransform, Injectable } from '@nestjs/common';

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi;
const ALL_TAGS = /<[^>]+>/g;
const JS_PROTO = /javascript\s*:/gi;
const EVENT_HANDLERS = /\bon\w+\s*=/gi;

function stripTags(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(DANGEROUS_BLOCKS, '')    // strip dangerous blocks + content
      .replace(ALL_TAGS, '')            // strip remaining tags
      .replace(JS_PROTO, '')            // strip JS protocol
      .replace(EVENT_HANDLERS, '');     // strip event handlers
  }
  if (Array.isArray(value)) return value.map(stripTags);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripTags(v)]),
    );
  }
  return value;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown) {
    return stripTags(value);
  }
}
