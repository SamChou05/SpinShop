import { User, Win, Bet } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Simple in-memory storage with file persistence (replace with real database later)
class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private wins: Map<string, Win> = new Map();
  private bets: Map<string, Bet> = new Map();
  private dataFile: string;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'data.json');
    this.loadData();
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = this.generateId();
    const now = new Date();
    
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.users.set(id, user);
    this.saveData();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    this.saveData();
    return updatedUser;
  }

  // Win operations
  async createWin(winData: Omit<Win, 'id' | 'createdAt' | 'updatedAt'>): Promise<Win> {
    const id = this.generateId();
    const now = new Date();
    
    const win: Win = {
      ...winData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.wins.set(id, win);
    this.saveData();
    return win;
  }

  async getWinById(id: string): Promise<Win | null> {
    return this.wins.get(id) || null;
  }

  async getWinsByUserId(userId: string): Promise<Win[]> {
    return Array.from(this.wins.values()).filter(win => win.userId === userId);
  }

  async getAllWins(): Promise<Win[]> {
    return Array.from(this.wins.values()).sort((a, b) => 
      b.winTimestamp.getTime() - a.winTimestamp.getTime()
    );
  }

  async updateWin(id: string, updates: Partial<Omit<Win, 'id' | 'createdAt'>>): Promise<Win | null> {
    const win = this.wins.get(id);
    if (!win) return null;

    const updatedWin = {
      ...win,
      ...updates,
      updatedAt: new Date(),
    };

    this.wins.set(id, updatedWin);
    this.saveData();
    return updatedWin;
  }

  // Bet operations
  async createBet(betData: Omit<Bet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bet> {
    const id = this.generateId();
    const now = new Date();
    
    const bet: Bet = {
      ...betData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.bets.set(id, bet);
    this.saveData();
    return bet;
  }

  async getBetById(id: string): Promise<Bet | null> {
    return this.bets.get(id) || null;
  }

  async getBetsByUserId(userId: string): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }

  async getAllBets(): Promise<Bet[]> {
    return Array.from(this.bets.values()).sort((a, b) => 
      b.betTimestamp.getTime() - a.betTimestamp.getTime()
    );
  }

  // Data persistence methods
  private loadData(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        
        // Load users
        if (data.users) {
          for (const [id, userData] of Object.entries(data.users)) {
            const user = userData as User;
            this.users.set(id, {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            });
          }
        }
        
        // Load wins
        if (data.wins) {
          for (const [id, winData] of Object.entries(data.wins)) {
            const win = winData as Win;
            this.wins.set(id, {
              ...win,
              winTimestamp: new Date(win.winTimestamp),
              createdAt: new Date(win.createdAt),
              updatedAt: new Date(win.updatedAt)
            });
          }
        }
        
        // Load bets
        if (data.bets) {
          for (const [id, betData] of Object.entries(data.bets)) {
            const bet = betData as Bet;
            this.bets.set(id, {
              ...bet,
              betTimestamp: new Date(bet.betTimestamp),
              createdAt: new Date(bet.createdAt),
              updatedAt: new Date(bet.updatedAt)
            });
          }
        }
        
        console.log(`🎰 DATABASE: Loaded ${this.users.size} users, ${this.wins.size} wins, and ${this.bets.size} bets from file`);
      }
    } catch (error) {
      console.error('🎰 DATABASE: Error loading data:', error);
    }
  }

  private saveData(): void {
    try {
      const data = {
        users: Object.fromEntries(this.users),
        wins: Object.fromEntries(this.wins),
        bets: Object.fromEntries(this.bets)
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('🎰 DATABASE: Error saving data:', error);
    }
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get statistics for admin dashboard
  async getStatistics() {
    const wins = await this.getAllWins();
    const bets = await this.getAllBets();
    const users = Array.from(this.users.values());
    
    // Calculate totals from all bets (wins and losses)
    const totalStakesCollected = bets.reduce((sum, bet) => sum + bet.stakeAmount, 0);
    const totalValuePaidOut = wins.reduce((sum, win) => sum + win.product.price, 0);
    const profitLoss = totalStakesCollected - totalValuePaidOut; // Positive = profit, Negative = loss
    
    // Bet statistics
    const totalBets = bets.length;
    const winningBets = bets.filter(b => b.won).length;
    const losingBets = bets.filter(b => !b.won).length;
    const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;

    return {
      totalUsers: users.length,
      totalBets,
      winningBets,
      losingBets,
      winRate: parseFloat(winRate.toFixed(2)),
      totalWins: wins.length,
      pendingWins: wins.filter(w => w.status === 'pending').length,
      processingWins: wins.filter(w => w.status === 'processing').length,
      orderedWins: wins.filter(w => w.status === 'ordered').length,
      shippedWins: wins.filter(w => w.status === 'shipped').length,
      deliveredWins: wins.filter(w => w.status === 'delivered').length,
      totalStakesCollected,
      totalValuePaidOut,
      profitLoss,
    };
  }

  // Reset data (for development/testing)
  async reset(): Promise<void> {
    this.users.clear();
    this.wins.clear();
    this.bets.clear();
    this.saveData();
  }
}

// Export singleton instance
export const db = new InMemoryDatabase();