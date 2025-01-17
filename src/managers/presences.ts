import type { Client } from '../client/mod.ts'
import type { Guild } from '../structures/guild.ts'
import { Presence } from '../structures/presence.ts'
import { User } from '../structures/user.ts'
import type { PresenceUpdatePayload } from '../types/gateway.ts'
import { BaseManager } from './base.ts'

export class GuildPresencesManager extends BaseManager<
  PresenceUpdatePayload,
  Presence
> {
  guild: Guild

  constructor(client: Client, guild: Guild) {
    super(client, `presences:${guild.id}`, Presence)
    this.guild = guild
  }

  async get(id: string): Promise<Presence | undefined> {
    const raw = await this._get(id)
    if (raw === undefined) return
    let user = await this.client.users.get(raw.user.id)
    if (user === undefined) user = new User(this.client, raw.user)
    const guild = await this.client.guilds.get(raw.guild_id)
    if (guild === undefined) return
    const presence = new Presence(this.client, raw, user, guild)
    return presence
  }

  async array(): Promise<Presence[]> {
    let arr = await (this.client.cache.array(
      this.cacheName
    ) as PresenceUpdatePayload[])
    if (arr === undefined) arr = []

    const result: Presence[] = []
    await Promise.all(
      arr.map(async (raw) => {
        let user = await this.client.users.get(raw.user.id)
        if (user === undefined) user = new User(this.client, raw.user)
        const guild = await this.client.guilds.get(raw.guild_id)
        if (guild === undefined) return
        result.push(new Presence(this.client, raw, user, guild))
      })
    )
    return result
  }

  async fromPayload(
    data: PresenceUpdatePayload[]
  ): Promise<GuildPresencesManager> {
    await this.flush()
    for (const pres of data) {
      await this.set(pres.user.id, pres)
    }
    return this
  }
}
