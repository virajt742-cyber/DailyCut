import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'clips',
      columns: [
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'video_path', type: 'string' },
        { name: 'thumbnail_path', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
