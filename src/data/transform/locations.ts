import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createLocations } from '../../fountain/queries';

export const locations: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed } = parseScreenplay(screenaplay);
  const queryRunner = createLocations();
  const results = queryRunner.run(parsed.tokens);

  const data = new MutableDataFrame({
    fields: [
      { name: 'name', type: FieldType.string },
      { name: 'count', type: FieldType.number },
    ],
  });

  results.forEach(({ name, count }) => {
    data.add({ name, count });
  });

  return {
    frames: [data],
  };
};
