import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createCharacters, createTextAnalysis } from '../../fountain/queries';

const MAX_CHARACTERS = 10;

export const textAnalysis: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed, basics } = parseScreenplay(screenaplay);
  const queryRunner = createTextAnalysis();

  var topCharacters = createCharacters()
    .run(parsed.tokens, basics, {
      sort_by: 'nof_scenes',
    })
    .splice(0, MAX_CHARACTERS);
  topCharacters.sort(function(a, b) {
    return a.name > b.name ? 1 : -1;
  });

  const results = queryRunner.run(parsed.tokens);

  let fields = [];

  fields = [
    { name: 'Name', type: FieldType.string },
    { name: 'Sentiment', type: FieldType.number },
    { name: 'Readability', type: FieldType.number },
    { name: 'Size', type: FieldType.number },
    { name: 'color', type: FieldType.string },
    // { name: 'colemanLiauIndex', type: FieldType.number },
    // { name: 'fleschKincaidGrade', type: FieldType.number },
  ];

  const maxTime = 0;
  const charactersTime = {};

  const max = { sentiment: 0, fleschReadingEase: 0, colemanLiauIndex: 0, fleschKincaidGrade: 0 };
  topCharacters.forEach(({ name, time }) => {
    const stats = results[name];
    if (stats) {
      maxTime = time > maxTime ? time : maxTime;
      charactersTime[name] = time;
      const r = stats.readability;
      max = {
        sentiment: Math.abs(stats.sentiment.score) > max.sentiment ? stats.sentiment.score : max.sentiment,
        fleschReadingEase:
          Math.abs(r.fleschReadingEase) > max.fleschReadingEase ? r.fleschReadingEase : max.fleschReadingEase,
        colemanLiauIndex:
          Math.abs(r.colemanLiauIndex) > max.colemanLiauIndex ? r.colemanLiauIndex : max.colemanLiauIndex,
        fleschKincaidGrade:
          Math.abs(r.fleschKincaidGrade) > max.fleschKincaidGrade ? r.fleschKincaidGrade : max.fleschKincaidGrade,
      };
    }
  });

  console.log(results);

  const data = new MutableDataFrame({
    fields,
  });

  topCharacters.forEach(({ name }) => {
    const stats = results[name];
    if (stats) {
      data.add({
        Name: name,
        Sentiment: results[name].sentiment.score,
        Readability: results[name].readability.fleschReadingEase,
        Size: Math.max(5, (charactersTime[name] / maxTime) * 15),
        color: '#ffffff',
        // colemanLiauIndex: results[name].readability.colemanLiauIndex / max.colemanLiauIndex,
        // fleschKincaidGrade: results[name].readability.fleschKincaidGrade / max.fleschKincaidGrade,
      });
    }
  });

  console.log(data);

  let message = '';
  if (false) {
    message = 'error';
  }

  return {
    frames: [data],
    message,
  };
};
