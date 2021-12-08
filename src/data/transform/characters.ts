import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createCharacters } from '../../fountain/queries';

export const characters: FountainToFrameTransformation = (screenaplay: string) => {
  const { basics, parsed } = parseScreenplay(screenaplay);
  const queryRunner = createCharacters();
  const results = queryRunner.run(parsed.tokens, basics);

  console.log(results);

  const data = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'Name', type: FieldType.string },
      { name: 'Scenes', type: FieldType.number },
      { name: 'Time', type: FieldType.number },
    ],
  });

  results.forEach(({ name, nof_scenes, time }) => {
    data.add({ Name: name, Scenes: nof_scenes, Time: time });
  });

  let message = '';
  if (results.length < 25 || results.length > 40) {
    message = `The screenplay has ${results.length} characters. Average screenplay has 25-40 characters.`;
  }

  return {
    frames: [data],
    message,
  };
};
