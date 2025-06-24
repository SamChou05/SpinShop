import { prisma } from './prisma';
import { User, Win, Bet } from './types';

export class PrismaDatabase {
  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        street: userData.address.street,
        city: userData.address.city,
        state: userData.address.state,
        zipCode: userData.address.zipCode,
        country: userData.address.country,
        phone: userData.phone,
      },
    });

    return this.formatUser(user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? this.formatUser(user) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.formatUser(user) : null;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      const updateData: any = {};
      
      if (updates.email) updateData.email = updates.email;
      if (updates.name) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      
      if (updates.address) {
        updateData.street = updates.address.street;
        updateData.city = updates.address.city;
        updateData.state = updates.address.state;
        updateData.zipCode = updates.address.zipCode;
        updateData.country = updates.address.country;
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return this.formatUser(user);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Bet operations
  async createBet(betData: Omit<Bet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bet> {
    const bet = await prisma.bet.create({
      data: {
        userId: betData.userId,
        productName: betData.product.name,
        productPrice: betData.product.price,
        productCurrency: betData.product.currency,
        productUrl: betData.product.url,
        productImage: betData.product.image,
        stakeAmount: betData.stakeAmount,
        probability: betData.probability,
        won: betData.won,
        betTimestamp: betData.betTimestamp,
      },
    });

    return this.formatBet(bet);
  }

  async getBetById(id: string): Promise<Bet | null> {
    const bet = await prisma.bet.findUnique({
      where: { id },
    });

    return bet ? this.formatBet(bet) : null;
  }

  async getBetsByUserId(userId: string): Promise<Bet[]> {
    const bets = await prisma.bet.findMany({
      where: { userId },
      orderBy: { betTimestamp: 'desc' },
    });

    return bets.map(this.formatBet);
  }

  async getAllBets(): Promise<Bet[]> {
    const bets = await prisma.bet.findMany({
      orderBy: { betTimestamp: 'desc' },
    });

    return bets.map(this.formatBet);
  }

  // Win operations
  async createWin(winData: Omit<Win, 'id' | 'createdAt' | 'updatedAt'>): Promise<Win> {
    const win = await prisma.win.create({
      data: {
        userId: winData.userId,
        productName: winData.product.name,
        productPrice: winData.product.price,
        productCurrency: winData.product.currency,
        productUrl: winData.product.url,
        productImage: winData.product.image,
        stakeAmount: winData.stakeAmount,
        probability: winData.probability,
        status: this.mapStatusToPrisma(winData.status),
        orderNumber: winData.orderDetails?.orderNumber,
        trackingNumber: winData.orderDetails?.trackingNumber,
        estimatedDelivery: winData.orderDetails?.estimatedDelivery,
        actualDelivery: winData.orderDetails?.actualDelivery,
        notes: winData.orderDetails?.notes,
        winTimestamp: winData.winTimestamp,
      },
    });

    return this.formatWin(win);
  }

  async getWinById(id: string): Promise<Win | null> {
    const win = await prisma.win.findUnique({
      where: { id },
    });

    return win ? this.formatWin(win) : null;
  }

  async getWinsByUserId(userId: string): Promise<Win[]> {
    const wins = await prisma.win.findMany({
      where: { userId },
      orderBy: { winTimestamp: 'desc' },
    });

    return wins.map(this.formatWin);
  }

  async getAllWins(): Promise<Win[]> {
    const wins = await prisma.win.findMany({
      orderBy: { winTimestamp: 'desc' },
    });

    return wins.map(this.formatWin);
  }

  async updateWin(id: string, updates: Partial<Omit<Win, 'id' | 'createdAt'>>): Promise<Win | null> {
    try {
      const updateData: any = {};
      
      if (updates.status) updateData.status = this.mapStatusToPrisma(updates.status);
      
      if (updates.orderDetails) {
        if (updates.orderDetails.orderNumber !== undefined) 
          updateData.orderNumber = updates.orderDetails.orderNumber;
        if (updates.orderDetails.trackingNumber !== undefined) 
          updateData.trackingNumber = updates.orderDetails.trackingNumber;
        if (updates.orderDetails.estimatedDelivery !== undefined) 
          updateData.estimatedDelivery = updates.orderDetails.estimatedDelivery;
        if (updates.orderDetails.actualDelivery !== undefined) 
          updateData.actualDelivery = updates.orderDetails.actualDelivery;
        if (updates.orderDetails.notes !== undefined) 
          updateData.notes = updates.orderDetails.notes;
      }

      const win = await prisma.win.update({
        where: { id },
        data: updateData,
      });

      return this.formatWin(win);
    } catch (error) {
      console.error('Error updating win:', error);
      return null;
    }
  }

  // Statistics
  async getStatistics() {
    const [users, bets, wins] = await Promise.all([
      prisma.user.count(),
      prisma.bet.findMany(),
      prisma.win.findMany(),
    ]);

    const totalStakesCollected = bets.reduce((sum, bet) => sum + bet.stakeAmount, 0);
    const totalValuePaidOut = wins.reduce((sum, win) => sum + win.productPrice, 0);
    const profitLoss = totalStakesCollected - totalValuePaidOut;
    
    const totalBets = bets.length;
    const winningBets = bets.filter(b => b.won).length;
    const losingBets = bets.filter(b => !b.won).length;
    const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;

    return {
      totalUsers: users,
      totalBets,
      winningBets,
      losingBets,
      winRate: parseFloat(winRate.toFixed(2)),
      totalWins: wins.length,
      pendingWins: wins.filter(w => w.status === 'PENDING').length,
      processingWins: wins.filter(w => w.status === 'PROCESSING').length,
      orderedWins: wins.filter(w => w.status === 'ORDERED').length,
      shippedWins: wins.filter(w => w.status === 'SHIPPED').length,
      deliveredWins: wins.filter(w => w.status === 'DELIVERED').length,
      totalStakesCollected,
      totalValuePaidOut,
      profitLoss,
    };
  }

  // Reset data (for development/testing)
  async reset(): Promise<void> {
    await prisma.$transaction([
      prisma.bet.deleteMany(),
      prisma.win.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }

  // Helper methods to format data
  private formatUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      address: {
        street: user.street,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
      },
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private formatBet(bet: any): Bet {
    return {
      id: bet.id,
      userId: bet.userId,
      product: {
        name: bet.productName,
        price: bet.productPrice,
        currency: bet.productCurrency,
        url: bet.productUrl,
        image: bet.productImage,
      },
      stakeAmount: bet.stakeAmount,
      probability: bet.probability,
      won: bet.won,
      betTimestamp: bet.betTimestamp,
      createdAt: bet.createdAt,
      updatedAt: bet.updatedAt,
    };
  }

  private formatWin(win: any): Win {
    try {
      return {
        id: win.id,
        userId: win.userId,
        product: {
          name: win.productName,
          price: win.productPrice,
          currency: win.productCurrency,
          url: win.productUrl,
          image: win.productImage,
        },
        stakeAmount: win.stakeAmount,
        probability: win.probability,
        status: win.status ? win.status.toLowerCase() : 'pending',
        orderDetails: {
          orderNumber: win.orderNumber || null,
          trackingNumber: win.trackingNumber || null,
          estimatedDelivery: win.estimatedDelivery || null,
          actualDelivery: win.actualDelivery || null,
          notes: win.notes || null,
        },
        winTimestamp: win.winTimestamp,
        createdAt: win.createdAt,
        updatedAt: win.updatedAt,
      };
    } catch (error) {
      console.error('Error formatting win:', error, 'Win data:', win);
      throw error;
    }
  }

  private mapStatusToPrisma(status: string): any {
    return status.toUpperCase().replace(/-/g, '_');
  }

  private mapStatusFromPrisma(status: string): Win['status'] {
    // Convert Prisma enum values to lowercase
    const mapped = status.toLowerCase() as Win['status'];
    console.log('Mapping status from Prisma:', status, 'to:', mapped);
    return mapped;
  }
}

// Export singleton instance
export const prismaDb = new PrismaDatabase();