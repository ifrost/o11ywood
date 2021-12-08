import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createDaysAndNights, createIntAndExt } from '../../fountain/queries';

export const intExt: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed, basics } = parseScreenplay(screenaplay);
  const queryRunner = createIntAndExt();
  const resultsList = queryRunner.run(parsed.tokens);

  const results = resultsList.reduce((prev, next) => {
    prev[next.label.toUpperCase()] = next.value;
    return prev;
  }, {});

  const data = new MutableDataFrame({
    fields: [
      { name: 'INT', type: FieldType.number },
      { name: 'EXT', type: FieldType.number },
      { name: 'MIXED', type: FieldType.number },
      { name: 'OTHER', type: FieldType.number },
    ],
  });
  data.add(results);

  let message = '';

  const p = {
    INT: (results.day / basics.nof_scenes) * 100,
    EXT: (results.day / basics.nof_scenes) * 100,
  };
  if (p.INT > 0.65 || p.INT < 0.35 || p.EXT > 0.65 || p.EXT < 0.35) {
    message = `Interior scenes are ${p.INT.toFixed(1)}%, exterior scenes are ${p.EXT.toFixed(
      1
    )}%. Average screenplays has both values between 35-65%.`;
  }

  return {
    frames: [data],
    message,
  };
};
