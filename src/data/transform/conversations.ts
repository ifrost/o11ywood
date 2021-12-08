import { createWhoWithWhom } from '../../fountain/queries';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';

const COLORS = [
  '#994444',
  '#449944',
  '#444499',
  '#11ff44',
  '#999999',
  '#7777aa',
  '#11be99',
  '#8856a3',
  '#115431',
  '#dde5af',
];

export const conversations: FountainToFrameTransformation = (content?: string) => {
  const { parsed, basics } = parseScreenplay(content);
  const queryRunner = createWhoWithWhom();
  const result = queryRunner.run(parsed.tokens, basics, 10);
  console.log(result);

  const nodes = new MutableDataFrame({
    refId: undefined,
    fields: [
      { name: 'id', values: [], type: FieldType.string },
      { name: 'title', values: [], type: FieldType.string },
      { name: 'color', values: [], type: FieldType.string },
    ],
  });

  result.characters.forEach(({ name }, index) => {
    nodes.add({ id: index, title: name, color: COLORS[index] || '#777777' });
  });

  const edges = new MutableDataFrame({
    refId: undefined,
    fields: [
      { name: 'id', values: [], type: FieldType.string },
      { name: 'source', values: [], type: FieldType.string },
      { name: 'target', values: [], type: FieldType.string },
    ],
  });

  result.links.forEach(({ link_id, from, to }) => {
    edges.add({ id: link_id + '_A', source: from, target: to });
    edges.add({ id: link_id + '_B', source: to, target: from });
  });

  return { frames: [nodes, edges] };
};
