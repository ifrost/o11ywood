import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createDaysAndNights } from '../../fountain/queries';

export const daysNights: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed, basics } = parseScreenplay(screenaplay);
  const queryRunner = createDaysAndNights();
  const resultsList = queryRunner.run(parsed.tokens, true);

  const results = resultsList.reduce((prev, next) => {
    prev[next.label] = next.value;
    return prev;
  }, {});

  const data = new MutableDataFrame({
    fields: [
      { name: 'DAY', type: FieldType.number },
      { name: 'NIGHT', type: FieldType.number },
      { name: 'DUSK', type: FieldType.number },
      { name: 'DAWN', type: FieldType.number },
    ],
  });
  data.add(results);

  let message = '';

  const p = {
    DAY: (results.day / basics.nof_scenes) * 100,
    NIGHT: (results.day / basics.nof_scenes) * 100,
  };
  if (p.DAY > 0.6 || p.DAY < 0.4) {
    message = `Day scenes are ${p.DAY.toFixed(1)}%, night scenes are ${p.NIGHT.toFixed(
      1
    )}%. Average screenplays has both values between 40-60%.`;
  }

  return {
    frames: [data],
    message,
  };
};
