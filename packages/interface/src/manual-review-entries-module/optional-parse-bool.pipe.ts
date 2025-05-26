import {
  PipeTransform,
  Injectable /*, ArgumentMetadata // Not used */,
} from '@nestjs/common';

@Injectable()
export class OptionalParseBoolPipe
  implements PipeTransform<string | undefined, boolean | undefined>
{
  transform(
    value: string | undefined /*, metadata: ArgumentMetadata */,
  ): boolean | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (value === 'true' || value === '1') {
      return true;
    }
    if (value === 'false' || value === '0') {
      return false;
    }
    // Consider throwing BadRequestException if value is present but not a valid boolean representation
    // For now, let it pass as undefined if not explicitly true/false
    // Or, you could throw new BadRequestException('Validation failed (boolean string is expected)');
    return undefined;
  }
}
