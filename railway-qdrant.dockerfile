FROM qdrant/qdrant:latest

EXPOSE 6333 6334

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:6333/health || exit 1

CMD ["./qdrant"]