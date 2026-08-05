/**
 * AI Timetable Generator - Genetic Algorithm
 * Generates conflict-free timetables using genetic algorithm optimization
 */

const POPULATION_SIZE = 30;
const MAX_GENERATIONS = 200;
const MUTATION_RATE = 0.05;
const ELITE_COUNT = 4;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Helper ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Chromosome ───────────────────────────────────────────────────────────────
// A chromosome is an array of gene objects:
// { classId, subjectId, staffId, roomId, timeSlotId, day }

function createGene(classId, subjectId, staffId, availableRooms, timeSlots, days, subjectType) {
  const suitableRooms = availableRooms.filter(r =>
    subjectType === 'lab'
      ? ['computer_lab', 'electronics_lab'].includes(r.room_type)
      : r.room_type === 'classroom' || r.room_type === 'seminar_hall'
  );
  const roomPool = suitableRooms.length > 0 ? suitableRooms : availableRooms;
  return {
    classId,
    subjectId,
    staffId,
    roomId: randomFrom(roomPool).id,
    timeSlotId: randomFrom(timeSlots).id,
    day: randomFrom(days),
  };
}

function buildRequiredSlots(assignments, subjectsMap, timeSlots, rooms, workingDays) {
  const required = [];
  for (const asgn of assignments) {
    const subject = subjectsMap[asgn.subject_id];
    if (!subject) continue;
    const hours = subject.hours_per_week || 3;
    for (let h = 0; h < hours; h++) {
      required.push({
        classId: asgn.class_id,
        subjectId: asgn.subject_id,
        staffId: asgn.staff_id,
        subjectType: subject.subject_type,
      });
    }
  }
  return required;
}

function generateChromosome(requiredSlots, rooms, timeSlots, workingDays, staffAvailMap) {
  const teachingSlots = timeSlots.filter(ts => !ts.is_break);
  return requiredSlots.map(slot => {
    const availDays = workingDays.filter(d => {
      const key = `${slot.staffId}_${d}`;
      return staffAvailMap[key] !== false;
    });
    const dayPool = availDays.length > 0 ? availDays : workingDays;
    return createGene(slot.classId, slot.subjectId, slot.staffId, rooms, teachingSlots, dayPool, slot.subjectType);
  });
}

// ─── Fitness ─────────────────────────────────────────────────────────────────

function calculateFitness(chromosome) {
  let conflicts = 0;

  // Index: key -> count
  const staffSlotDay = {};    // staff clash
  const classSlotDay = {};    // class clash
  const roomSlotDay = {};     // room clash

  for (const gene of chromosome) {
    const key1 = `${gene.staffId}_${gene.timeSlotId}_${gene.day}`;
    const key2 = `${gene.classId}_${gene.timeSlotId}_${gene.day}`;
    const key3 = `${gene.roomId}_${gene.timeSlotId}_${gene.day}`;

    staffSlotDay[key1] = (staffSlotDay[key1] || 0) + 1;
    classSlotDay[key2] = (classSlotDay[key2] || 0) + 1;
    roomSlotDay[key3] = (roomSlotDay[key3] || 0) + 1;
  }

  for (const v of Object.values(staffSlotDay)) if (v > 1) conflicts += (v - 1) * 5;
  for (const v of Object.values(classSlotDay)) if (v > 1) conflicts += (v - 1) * 5;
  for (const v of Object.values(roomSlotDay)) if (v > 1) conflicts += (v - 1) * 3;

  // Penalise consecutive periods for same staff (max 3 in a row)
  const staffDayPeriods = {};
  for (const gene of chromosome) {
    const key = `${gene.staffId}_${gene.day}`;
    if (!staffDayPeriods[key]) staffDayPeriods[key] = [];
    staffDayPeriods[key].push(gene.timeSlotId);
  }
  for (const periods of Object.values(staffDayPeriods)) {
    const sorted = [...new Set(periods)].sort((a, b) => a - b);
    let consecutive = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        consecutive++;
        if (consecutive > 3) conflicts += 2;
      } else {
        consecutive = 1;
      }
    }
  }

  const score = Math.max(0, 100 - conflicts);
  return { score, conflicts };
}

// ─── Selection ────────────────────────────────────────────────────────────────

function tournamentSelect(population, fitnessScores) {
  const t1 = Math.floor(Math.random() * population.length);
  const t2 = Math.floor(Math.random() * population.length);
  return fitnessScores[t1].score >= fitnessScores[t2].score ? population[t1] : population[t2];
}

// ─── Crossover ───────────────────────────────────────────────────────────────

function crossover(parent1, parent2) {
  const point = Math.floor(Math.random() * parent1.length);
  return [
    [...parent1.slice(0, point), ...parent2.slice(point)],
    [...parent2.slice(0, point), ...parent1.slice(point)],
  ];
}

// ─── Mutation ────────────────────────────────────────────────────────────────

function mutate(chromosome, rooms, timeSlots, workingDays, staffAvailMap, subjectsMap) {
  const teachingSlots = timeSlots.filter(ts => !ts.is_break);
  return chromosome.map(gene => {
    if (Math.random() < MUTATION_RATE) {
      const subj = subjectsMap[gene.subjectId];
      const subjectType = subj ? subj.subject_type : 'theory';
      const availDays = workingDays.filter(d => staffAvailMap[`${gene.staffId}_${d}`] !== false);
      const dayPool = availDays.length > 0 ? availDays : workingDays;
      return {
        ...gene,
        timeSlotId: randomFrom(teachingSlots).id,
        day: randomFrom(dayPool),
        roomId: (() => {
          const suitableRooms = rooms.filter(r =>
            subjectType === 'lab'
              ? ['computer_lab', 'electronics_lab'].includes(r.room_type)
              : r.room_type === 'classroom' || r.room_type === 'seminar_hall'
          );
          return randomFrom(suitableRooms.length > 0 ? suitableRooms : rooms).id;
        })(),
      };
    }
    return gene;
  });
}

// ─── Main GA Function ─────────────────────────────────────────────────────────

async function runGeneticAlgorithm(assignments, subjectsMap, rooms, timeSlots, workingDays, staffAvailMap) {
  const requiredSlots = buildRequiredSlots(assignments, subjectsMap, timeSlots, rooms, workingDays);

  if (requiredSlots.length === 0) {
    return { chromosome: [], fitnessScore: 100, conflicts: 0, generations: 0 };
  }

  // Initialise population
  let population = Array.from({ length: POPULATION_SIZE }, () =>
    generateChromosome(requiredSlots, rooms, timeSlots, workingDays, staffAvailMap)
  );

  let bestChromosome = null;
  let bestFitness = { score: -1, conflicts: Infinity };
  let generationsRun = 0;

  for (let gen = 0; gen < MAX_GENERATIONS; gen++) {
    generationsRun = gen + 1;
    const fitnessScores = population.map(ch => calculateFitness(ch));

    // Track best
    fitnessScores.forEach((f, i) => {
      if (f.score > bestFitness.score || (f.score === bestFitness.score && f.conflicts < bestFitness.conflicts)) {
        bestFitness = f;
        bestChromosome = population[i];
      }
    });

    if (bestFitness.conflicts === 0) break;

    // Sort by fitness (descending)
    const ranked = population
      .map((ch, i) => ({ ch, score: fitnessScores[i] }))
      .sort((a, b) => b.score.score - a.score.score);

    // Elitism
    const newPopulation = ranked.slice(0, ELITE_COUNT).map(r => r.ch);

    // Fill rest with crossover + mutation
    while (newPopulation.length < POPULATION_SIZE) {
      const p1 = tournamentSelect(population, fitnessScores);
      const p2 = tournamentSelect(population, fitnessScores);
      const [c1, c2] = crossover(p1, p2);
      newPopulation.push(mutate(c1, rooms, timeSlots, workingDays, staffAvailMap, subjectsMap));
      if (newPopulation.length < POPULATION_SIZE) {
        newPopulation.push(mutate(c2, rooms, timeSlots, workingDays, staffAvailMap, subjectsMap));
      }
    }

    population = newPopulation;
  }

  return {
    chromosome: bestChromosome || population[0],
    fitnessScore: bestFitness.score,
    conflicts: bestFitness.conflicts,
    generations: generationsRun,
  };
}

module.exports = { runGeneticAlgorithm, calculateFitness };
