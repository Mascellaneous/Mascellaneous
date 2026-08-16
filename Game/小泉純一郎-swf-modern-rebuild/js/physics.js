(() => {
"use strict";

const TAU = Math.PI * 2;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function normalizeAngle(angle) {
  let result = angle;
  while (result > Math.PI) result -= TAU;
  while (result < -Math.PI) result += TAU;
  return result;
}

class Particle {
  constructor(name, x, y, mass = 1, radius = 13) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.mass = mass;
    this.invMass = 1 / mass;
    this.radius = radius;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
  }

  integrate(gravity, damping, dt) {
    const vx = (this.x - this.px) * damping;
    const vy = (this.y - this.py) * damping;
    this.px = this.x;
    this.py = this.y;
    this.x += vx;
    this.y += vy + gravity * dt * dt;
  }

  pullTo(x, y, strength) {
    const oldX = this.x;
    const oldY = this.y;
    this.x += (x - this.x) * strength;
    this.y += (y - this.y) * strength;
    this.px = oldX + (this.px - oldX) * 0.35;
    this.py = oldY + (this.py - oldY) * 0.35;
  }
}

class DistanceConstraint {
  constructor(a, b, length = Math.hypot(b.x - a.x, b.y - a.y), stiffness = 1) {
    this.a = a;
    this.b = b;
    this.length = length;
    this.stiffness = stiffness;
  }

  solve() {
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.0001) return;
    const difference = ((distance - this.length) / distance) * this.stiffness;
    const totalInvMass = this.a.invMass + this.b.invMass;
    const aRatio = this.a.invMass / totalInvMass;
    const bRatio = this.b.invMass / totalInvMass;
    const offsetX = dx * difference;
    const offsetY = dy * difference;
    this.a.x += offsetX * aRatio;
    this.a.y += offsetY * aRatio;
    this.b.x -= offsetX * bRatio;
    this.b.y -= offsetY * bRatio;
  }
}

class AngleConstraint {
  constructor(a, pivot, b, minAngle, maxAngle, stiffness = 0.34) {
    this.a = a;
    this.pivot = pivot;
    this.b = b;
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
    this.stiffness = stiffness;
    const aAngle = Math.atan2(a.y - pivot.y, a.x - pivot.x);
    const bAngle = Math.atan2(b.y - pivot.y, b.x - pivot.x);
    this.restAngle = normalizeAngle(aAngle - bAngle);
  }

  solve() {
    const aAngle = Math.atan2(this.a.y - this.pivot.y, this.a.x - this.pivot.x);
    const bAngle = Math.atan2(this.b.y - this.pivot.y, this.b.x - this.pivot.x);
    const current = normalizeAngle(aAngle - bAngle);
    const relativeAngle = normalizeAngle(current - this.restAngle);
    const target = clamp(relativeAngle, this.minAngle, this.maxAngle);
    const correction = normalizeAngle(target - relativeAngle) * this.stiffness;
    if (Math.abs(correction) < 0.00001) return;

    const aDistance = Math.hypot(this.a.x - this.pivot.x, this.a.y - this.pivot.y);
    const bDistance = Math.hypot(this.b.x - this.pivot.x, this.b.y - this.pivot.y);
    const totalInvMass = this.a.invMass + this.b.invMass;
    const aTurn = correction * (this.a.invMass / totalInvMass);
    const bTurn = correction * (this.b.invMass / totalInvMass);

    this.a.x = this.pivot.x + Math.cos(aAngle + aTurn) * aDistance;
    this.a.y = this.pivot.y + Math.sin(aAngle + aTurn) * aDistance;
    this.b.x = this.pivot.x + Math.cos(bAngle - bTurn) * bDistance;
    this.b.y = this.pivot.y + Math.sin(bAngle - bTurn) * bDistance;
  }
}

class CircleObstacle {
  constructor(x, y, radius, seed = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.seed = seed;
  }
}

class PhysicsWorld {
  constructor() {
    this.particles = [];
    this.distanceConstraints = [];
    this.angleConstraints = [];
    this.obstacles = [];
    this.gravity = 1320;
    this.damping = 0.997;
    this.iterations = 3;
    this.dragged = [];
    this.dragTarget = { x: 0, y: 0 };
  }

  addParticle(particle) {
    this.particles.push(particle);
    return particle;
  }

  addDistance(a, b, length, stiffness) {
    const constraint = new DistanceConstraint(a, b, length, stiffness);
    this.distanceConstraints.push(constraint);
    return constraint;
  }

  addAngle(a, pivot, b, minAngle, maxAngle, stiffness) {
    const constraint = new AngleConstraint(a, pivot, b, minAngle, maxAngle, stiffness);
    this.angleConstraints.push(constraint);
    return constraint;
  }

  setDragTarget(x, y) {
    this.dragTarget.x = x;
    this.dragTarget.y = y;
  }

  selectNear(x, y, radius = 62) {
    const radiusSquared = radius * radius;
    this.dragged = this.particles.filter((particle) => {
      const dx = particle.x - x;
      const dy = particle.y - y;
      return dx * dx + dy * dy <= radiusSquared;
    });
    return this.dragged.length;
  }

  release() {
    this.dragged = [];
  }

  step(dt) {
    for (const particle of this.particles) {
      particle.integrate(this.gravity, this.damping, dt);
    }

    for (const particle of this.dragged) {
      particle.pullTo(this.dragTarget.x, this.dragTarget.y, 0.34);
    }

    for (let pass = 0; pass < this.iterations; pass += 1) {
      for (const constraint of this.angleConstraints) constraint.solve();
      for (const constraint of this.distanceConstraints) constraint.solve();
      this.solveObstacleCollisions();
    }
  }

  solveObstacleCollisions() {
    for (const particle of this.particles) {
      for (const obstacle of this.obstacles) {
        const dx = particle.x - obstacle.x;
        const dy = particle.y - obstacle.y;
        const minimum = particle.radius + obstacle.radius;
        const distance = Math.hypot(dx, dy);
        if (distance >= minimum) continue;
        const nx = distance > 0.0001 ? dx / distance : Math.cos(obstacle.seed + particle.radius);
        const ny = distance > 0.0001 ? dy / distance : Math.sin(obstacle.seed + particle.radius);
        const overlap = minimum - distance;
        particle.x += nx * overlap;
        particle.y += ny * overlap;
      }
    }
  }
}


window.KRPhysics = Object.freeze({
  TAU,
  clamp,
  normalizeAngle,
  Particle,
  DistanceConstraint,
  AngleConstraint,
  CircleObstacle,
  PhysicsWorld,
});
})();
