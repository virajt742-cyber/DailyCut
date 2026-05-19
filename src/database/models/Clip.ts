import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Clip extends Model {
  static table = 'clips';

  @field('date') date!: number;
  @field('video_path') videoPath!: string;
  @field('thumbnail_path') thumbnailPath!: string;
  @readonly @date('created_at') createdAt!: number;
}
