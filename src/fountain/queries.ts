import { FQueryBuilder } from './fquery';
import { fhelpers } from './fhelpers';

export const createDaysAndNights = function() {
  var runner = {};

  const h = fhelpers.fq;

  runner.run = function(tokens, stats_keep_last_scene_time) {
    var query = FQueryBuilder('label', {
      value: 0,
    });
    query.prepare(function(fq) {
      fq.recognized_scenes = 0;
    });
    query
      .count('value', h.has_scene_time('DAY'), 'DAY', true)
      .count('value', h.has_scene_time('NIGHT'), 'NIGHT', true)
      .count('value', h.has_scene_time('DUSK'), 'DUSK', true)
      .count('value', h.has_scene_time('DAWN'), 'DAWN', true);
    query.enter(h.is('scene_heading'), function(item, fq) {
      if (stats_keep_last_scene_time && fq.last_selection) {
        fq.last_selection.value++;
      }
    });
    query.exit(function(item, fq) {
      fq.recognized_scenes += item.value;
    });
    query.end(function(result, fq) {
      var all_scenes = FQueryBuilder()
        .count('scenes', h.is('scene_heading'))
        .run(fq.source).scenes;

      result.push({
        label: 'OTHER',
        value: all_scenes - fq.recognized_scenes,
      });
    });
    return query.run(tokens);
  };

  return runner;
};

export const createSceneLength = function() {
  const h = fhelpers.fq;

  var runner = {};
  runner.run = function(tokens, stats_keep_last_scene_time) {
    var query = FQueryBuilder('token', {
      length: 0,
    });
    query.prepare(function(fq) {
      fq.current_header = undefined;
    });
    query.enter(h.is('scene_heading'), function(token, fq) {
      fq.current_header = fq.select(token);
      fq.current_header.header = token.text;
      fq.current_header.location_type = token.location_type();
    });
    query.enter(true, function(item, fq) {
      if (fq.current_header) {
        fq.current_header.length += item.lines.length;
        if (fq.current_header.token.has_scene_time('DAY')) {
          fq.current_header.type = 'day';
        } else if (fq.current_header.token.has_scene_time('NIGHT')) {
          fq.current_header.type = 'night';
        } else {
          fq.current_header.type = fq.last_header_type || 'other';
        }
        fq.last_header_type = stats_keep_last_scene_time ? fq.current_header.type : undefined;
      }
    });
    return query.run(tokens);
  };
  return runner;
};
