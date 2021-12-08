import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createTempo } from '../../fountain/queries';

export const pulse: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed } = parseScreenplay(screenaplay);
  const queryRunner = createTempo();
  const results = queryRunner.run(parsed.tokens);

  console.log(results);

  const data = new MutableDataFrame({
    fields: [
      { name: 'sentence', type: FieldType.number },
      { name: 'value', type: FieldType.number },
    ],
  });

  results.forEach(({ tempo }, index) => {
    data.add({ sentence: index, value: tempo });
  });

  return {
    frames: [data],
  };
};
